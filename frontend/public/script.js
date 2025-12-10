document.addEventListener('DOMContentLoaded', () => {
  // ripple effect for buttons
  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const ripple = document.createElement('span');
      const size = Math.max(rect.width, rect.height) * 1.8;
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.position = 'absolute';
      ripple.style.left = (e.clientX - rect.left - size/2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size/2) + 'px';
      ripple.style.background = 'radial-gradient(circle, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.06) 40%, transparent 60%)';
      ripple.style.pointerEvents = 'none';
      ripple.style.borderRadius = '50%';
      ripple.style.transform = 'scale(0)';
      ripple.style.opacity = '0.9';
      ripple.style.transition = 'transform 520ms cubic-bezier(.2,.9,.2,1), opacity 520ms';
      ripple.className = 'ripple-helper';
      this.style.position = 'relative';
      this.appendChild(ripple);
      requestAnimationFrame(() => {
        ripple.style.transform = 'scale(1)';
        ripple.style.opacity = '0';
      });
      setTimeout(() => { try { ripple.remove(); } catch (e) {} }, 700);
    });
  });

  // highlight outputs when their text changes
  const outputs = document.querySelectorAll('.output');
  outputs.forEach(out => {
    const mo = new MutationObserver(() => {
      out.classList.remove('pulse');
      // trigger reflow to restart animation
      void out.offsetWidth;
      out.classList.add('pulse');
      setTimeout(() => out.classList.remove('pulse'), 900);
    });
    mo.observe(out, { characterData: true, childList: true, subtree: true });
  });

  // enhanced drag-and-drop and file-list for file input
  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const fileListEl = document.getElementById('fileList');
  let selectedFiles = [];
  let isProcessingFiles = false; // Flag to prevent re-entry
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file limit

  function bytesToSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function renderFileList() {
    if (!fileListEl) return;
    // Defer DOM manipulation to prevent blocking
    setTimeout(() => {
      try {
        fileListEl.innerHTML = '';
        if (selectedFiles.length === 0) return;
        selectedFiles.forEach((f, idx) => {
          try {
            const item = document.createElement('div');
            item.className = 'file-item';

            const meta = document.createElement('div');
            meta.className = 'file-meta';

            const name = document.createElement('div');
            name.className = 'file-name';
            name.title = f.name;
            name.textContent = f.name;

            const size = document.createElement('div');
            size.className = 'file-size';
            // Safely access file size
            try {
              size.textContent = bytesToSize(f.size);
            } catch (err) {
              size.textContent = 'Unknown size';
            }

            meta.appendChild(name);
            meta.appendChild(size);

            const actions = document.createElement('div');
            actions.className = 'file-actions';
            const remove = document.createElement('button');
            remove.className = 'remove-btn';
            remove.textContent = 'Remove';
            remove.addEventListener('click', () => {
              selectedFiles.splice(idx, 1);
              // When removing, we want to dispatch change event so upload.js knows about it
              updateFileInputFromArray(false);
              renderFileList();
            });
            actions.appendChild(remove);

            item.appendChild(meta);
            item.appendChild(actions);
            fileListEl.appendChild(item);
          } catch (err) {
            console.error('Error rendering file item:', err);
          }
        });
      } catch (err) {
        console.error('Error rendering file list:', err);
      }
    }, 0);
  }

  function updateFileInputFromArray(skipEvent = false) {
    // reflect selectedFiles into the hidden file input so other code can use it
    // skipEvent: if true, don't dispatch change event (prevents circular events)
    try {
      const dt = new DataTransfer();
      selectedFiles.forEach(f => {
        try {
          dt.items.add(f);
        } catch (err) {
          console.error('Error adding file to DataTransfer:', err);
        }
      });
      fileInput.files = dt.files;
      // Only dispatch change event if not skipping (e.g., when removing files)
      if (!skipEvent) {
        setTimeout(() => {
          const event = new Event('change', { bubbles: true });
          fileInput.dispatchEvent(event);
        }, 0);
      }
    } catch (err) {
      console.error('Error updating file input:', err);
    }
  }

  if (fileInput && dropZone) {
    // make dropZone keyboard accessible
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
    });

    // handle file input change (when user picks via dialog)
    fileInput.addEventListener('change', (e) => {
      // Prevent re-entry if already processing
      if (isProcessingFiles) return;
      
      // Defer file processing to prevent UI blocking - use setTimeout to yield to browser
      const files = Array.from(e.target.files || []);
      setTimeout(() => {
        isProcessingFiles = true;
        let hasNewFiles = false;
        
        files.forEach(f => {
          try {
            // Check if file already exists in selectedFiles (by name and size)
            const alreadyExists = selectedFiles.some(
              existing => existing.name === f.name && existing.size === f.size && existing.lastModified === f.lastModified
            );
            
            if (alreadyExists) {
              return; // Skip duplicate files
            }
            
            // Access file.size in try-catch to handle potential issues with large files
            const fileSize = f.size;
            if (fileSize > MAX_FILE_SIZE) {
              // skip files that are too large and show temporary alert in list
              const warn = document.createElement('div');
              warn.className = 'file-item';
              warn.textContent = `${f.name} — file too large (${bytesToSize(fileSize)}). Max ${bytesToSize(MAX_FILE_SIZE)}.`;
              if (fileListEl) fileListEl.appendChild(warn);
              setTimeout(() => { try { warn.remove(); } catch (e) {} }, 5000);
            } else {
              selectedFiles.push(f);
              hasNewFiles = true;
            }
          } catch (err) {
            console.error('Error processing file:', f.name, err);
          }
        });
        
        if (hasNewFiles) {
          // Skip event dispatch to prevent circular events - we're already in a change handler
          updateFileInputFromArray(true);
          renderFileList();
        }
        
        isProcessingFiles = false;
      }, 0);
    }, { passive: true });

    // drag-and-drop handlers (prevent defaults)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, () => dropZone.classList.add('drag-over'));
    });

    ['dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, () => dropZone.classList.remove('drag-over'));
    });

    dropZone.addEventListener('drop', (e) => {
      // Prevent re-entry if already processing
      if (isProcessingFiles) return;
      
      // Defer file processing to prevent UI blocking - use setTimeout to yield to browser
      const files = Array.from(e.dataTransfer.files || []);
      setTimeout(() => {
        isProcessingFiles = true;
        let hasNewFiles = false;
        
        files.forEach(f => {
          try {
            // Check if file already exists in selectedFiles (by name and size)
            const alreadyExists = selectedFiles.some(
              existing => existing.name === f.name && existing.size === f.size && existing.lastModified === f.lastModified
            );
            
            if (alreadyExists) {
              return; // Skip duplicate files
            }
            
            // Access file.size in try-catch to handle potential issues with large files
            const fileSize = f.size;
            if (fileSize > MAX_FILE_SIZE) {
              const warn = document.createElement('div');
              warn.className = 'file-item';
              warn.textContent = `${f.name} — file too large (${bytesToSize(fileSize)}). Max ${bytesToSize(MAX_FILE_SIZE)}.`;
              if (fileListEl) fileListEl.appendChild(warn);
              setTimeout(() => { try { warn.remove(); } catch (e) {} }, 5000);
            } else {
              selectedFiles.push(f);
              hasNewFiles = true;
            }
          } catch (err) {
            console.error('Error processing file:', f.name, err);
          }
        });
        
        if (hasNewFiles) {
          // Skip event dispatch to prevent circular events - drop handler doesn't need to trigger change
          updateFileInputFromArray(true);
          renderFileList();
        }
        
        isProcessingFiles = false;
      }, 0);
    });
  }

  // small keyboard shortcut: Ctrl+K focuses user id
  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'k') {
      const el = document.getElementById('userId');
      if (el) { el.focus(); e.preventDefault(); }
    }
  });
});

