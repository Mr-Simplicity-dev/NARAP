// ==================== FILE UPLOAD MODULE ====================

class FileUploadManager {
    constructor() {
        this.supportedTypes = {
            image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
            document: ['application/pdf', 'text/csv', 'application/vnd.ms-excel']
        };
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // File input change handlers
        document.addEventListener('change', (e) => {
            if (e.target.type === 'file') {
                this.handleFileInputChange(e);
            }
        });

        // Drag and drop handlers
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        document.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });
    }

    handleFileInputChange(event) {
        const input = event.target;
        const files = Array.from(input.files);
        
        if (files.length === 0) return;

        files.forEach(file => {
            this.processFile(file, input);
        });
    }

    handleFileDrop(event) {
        const files = Array.from(event.dataTransfer.files);
        const dropZone = event.target.closest('.drop-zone');
        
        if (!dropZone) return;

        files.forEach(file => {
            this.processFile(file, dropZone);
        });
    }

    processFile(file, targetElement) {
        // Validate file
        const validation = this.validateFile(file);
        if (!validation.valid) {
            if (typeof showMessage === 'function') {
                showMessage(validation.error, 'error');
            }
            return;
        }

        // Show preview if it's an image
        if (this.supportedTypes.image.includes(file.type)) {
            this.showImagePreview(file, targetElement);
        }

        // Update form data
        this.updateFormData(file, targetElement);
    }

    validateFile(file) {
        // Check file size
        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File size exceeds ${this.maxFileSize / (1024 * 1024)}MB limit`
            };
        }

        // Check file type
        const allSupportedTypes = [
            ...this.supportedTypes.image,
            ...this.supportedTypes.document
        ];

        if (!allSupportedTypes.includes(file.type)) {
            return {
                valid: false,
                error: 'Unsupported file type'
            };
        }

        return { valid: true };
    }

    showImagePreview(file, targetElement) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = targetElement.querySelector('.image-preview');
            if (preview) {
                preview.src = e.target.result;
                preview.style.display = 'block';
            } else {
                // Create preview if it doesn't exist
                this.createImagePreview(e.target.result, targetElement);
            }
        };
        reader.readAsDataURL(file);
    }

    createImagePreview(src, targetElement) {
        const preview = document.createElement('img');
        preview.src = src;
        preview.className = 'image-preview';
        preview.style.cssText = `
            max-width: 200px;
            max-height: 200px;
            border-radius: 4px;
            margin-top: 10px;
            display: block;
        `;
        
        targetElement.appendChild(preview);
    }

    updateFormData(file, targetElement) {
        // Update the file input if it exists
        const fileInput = targetElement.querySelector('input[type="file"]');
        if (fileInput) {
            // Create a new FileList with the file
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
        }
    }

    // Specific upload handlers
    handlePassportUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.processFile(file, event.target);
        
        if (typeof showMessage === 'function') {
            showMessage('Passport photo selected', 'success');
        }
    }

    handleSignatureUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.processFile(file, event.target);
        
        if (typeof showMessage === 'function') {
            showMessage('Signature selected', 'success');
        }
    }

    handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const validation = this.validateFile(file);
        if (!validation.valid) {
            if (typeof showMessage === 'function') {
                showMessage(validation.error, 'error');
            }
            return;
        }

        // Process CSV file
        this.processCSVFile(file);
    }

    async processCSVFile(file) {
        try {
            if (typeof showMessage === 'function') {
                showMessage('Processing CSV file...', 'info');
            }

            // Upload to server
            if (window.apiManager) {
                const result = await window.apiManager.importCSV(file, 'members');
                
                if (typeof showMessage === 'function') {
                    showMessage('CSV imported successfully', 'success');
                }

                // Refresh members list
                if (typeof loadMembers === 'function') {
                    loadMembers();
                }
            }
        } catch (error) {
            console.error('CSV processing error:', error);
            if (typeof showMessage === 'function') {
                showMessage('Failed to process CSV file', 'error');
            }
        }
    }

    // Clear file upload
    clearFileUpload(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.value = '';
            
            // Clear preview
            const preview = input.parentElement.querySelector('.image-preview');
            if (preview) {
                preview.remove();
            }
        }
    }

    // Get image URL helper
    getImageUrl(imagePath) {
        if (!imagePath) return '';
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // If it's a Cloudinary URL, return as is
        if (imagePath.includes('cloudinary.com')) {
            return imagePath;
        }
        
        // Construct full URL
        const baseURL = window.apiManager ? window.apiManager.baseURL : 'https://narap-backend.onrender.com';
        return `${baseURL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
    }

    // Test functions
    testPassportUpload() {
        const passportInput = document.getElementById('memberPassport');
        if (!passportInput) {
            console.log('❌ Passport input not found');
            return false;
        }

        console.log('✅ Passport input found');
        return true;
    }

    debugFileUpload() {
        console.log('🔍 File Upload Debug Info:');
        console.log('- Supported image types:', this.supportedTypes.image);
        console.log('- Supported document types:', this.supportedTypes.document);
        console.log('- Max file size:', this.maxFileSize / (1024 * 1024), 'MB');
        
        const fileInputs = document.querySelectorAll('input[type="file"]');
        console.log('- File inputs found:', fileInputs.length);
        
        fileInputs.forEach((input, index) => {
            console.log(`  ${index + 1}. ID: ${input.id}, Name: ${input.name}`);
        });
    }
}

// Global functions for backward compatibility
function handleFileUpload(event) {
    if (window.fileUploadManager) {
        window.fileUploadManager.handleFileInputChange(event);
    }
}

function handleImageUpload(event) {
    if (window.fileUploadManager) {
        window.fileUploadManager.handleImageUpload(event);
    }
}

function handleCSVUpload(event) {
    if (window.fileUploadManager) {
        window.fileUploadManager.handleCSVUpload(event);
    }
}

function showImagePreview(file, targetElement) {
    if (window.fileUploadManager) {
        window.fileUploadManager.showImagePreview(file, targetElement);
    }
}

function clearFileUpload(inputId) {
    if (window.fileUploadManager) {
        window.fileUploadManager.clearFileUpload(inputId);
    }
}

function testPassportUpload() {
    if (window.fileUploadManager) {
        return window.fileUploadManager.testPassportUpload();
    }
    return false;
}

function debugFileUpload() {
    if (window.fileUploadManager) {
        window.fileUploadManager.debugFileUpload();
    }
}

function getImageUrl(imagePath) {
    if (window.fileUploadManager) {
        return window.fileUploadManager.getImageUrl(imagePath);
    }
    return imagePath || '';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileUploadManager;
} else {
    window.FileUploadManager = FileUploadManager;
    window.handleFileUpload = handleFileUpload;
    window.handleImageUpload = handleImageUpload;
    window.handleCSVUpload = handleCSVUpload;
    window.showImagePreview = showImagePreview;
    window.clearFileUpload = clearFileUpload;
    window.testPassportUpload = testPassportUpload;
    window.debugFileUpload = debugFileUpload;
    window.getImageUrl = getImageUrl;
}
