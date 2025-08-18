#!/usr/bin/env node

/**
 * NARAP Member Editing Fix Script
 * This script fixes the function conflicts in admin.js that prevent member editing from working
 */

const fs = require('fs');
const path = require('path');

const adminJsPath = path.join(__dirname, 'js', 'admin.js');

console.log('🔧 NARAP Member Editing Fix Script');
console.log('==================================');
console.log(`📁 Target file: ${adminJsPath}`);
console.log('');

try {
    // Read the admin.js file
    if (!fs.existsSync(adminJsPath)) {
        console.error('❌ admin.js file not found!');
        process.exit(1);
    }

    let content = fs.readFileSync(adminJsPath, 'utf8');
    console.log('✅ admin.js file loaded successfully');
    console.log(`📊 File size: ${(content.length / 1024).toFixed(2)} KB`);

    // Count conflicting function definitions
    const editMemberConflicts = (content.match(/window\.editMember\s*=\s*function/g) || []).length;
    const showEditMemberModalConflicts = (content.match(/window\.showEditMemberModal\s*=\s*function/g) || []).length;

    console.log(`🔍 Found ${editMemberConflicts} conflicting editMember function definitions`);
    console.log(`🔍 Found ${showEditMemberModalConflicts} conflicting showEditMemberModal function definitions`);

    if (editMemberConflicts === 0 && showEditMemberModalConflicts === 0) {
        console.log('✅ No conflicts found - member editing should already work!');
        process.exit(0);
    }

    // Remove conflicting function definitions
    console.log('\n🛠️ Removing conflicting function definitions...');

    // Remove all window.editMember = function(...) assignments
    content = content.replace(
        /window\.editMember\s*=\s*function\s*\([^)]*\)\s*\{[\s\S]*?\};?\s*\}\);?/g,
        '// REMOVED: Conflicting editMember function definition'
    );

    // Remove all window.showEditMemberModal = function(...) assignments
    content = content.replace(
        /window\.showEditMemberModal\s*=\s*function\s*\([^)]*\)\s*\{[\s\S]*?\};?\s*\}\);?/g,
        '// REMOVED: Conflicting showEditMemberModal function definition'
    );

    // Add clean function assignments at the end
    const cleanAssignments = `

// ==================== CLEAN FUNCTION ASSIGNMENTS ====================
// This section overrides all conflicting function definitions to fix member editing

// Clean function assignments - these override all conflicting definitions
window.editMember = editMember;
window.showEditMemberModal = showEditMemberModal;

console.log('✅ Clean function assignments applied - member editing should now work');
console.log('🔧 editMember function type:', typeof window.editMember);
console.log('🔧 showEditMemberModal function type:', typeof window.showEditMemberModal);
`;

    content += cleanAssignments;

    // Write the fixed file
    fs.writeFileSync(adminJsPath, content, 'utf8');
    console.log('✅ Fixed admin.js file saved successfully');

    // Verify the fix
    const newContent = fs.readFileSync(adminJsPath, 'utf8');
    const newEditMemberConflicts = (newContent.match(/window\.editMember\s*=\s*function/g) || []).length;
    const newShowEditMemberModalConflicts = (newContent.match(/window\.showEditMemberModal\s*=\s*function/g) || []).length;

    console.log('\n🔍 Verification:');
    console.log(`   editMember conflicts: ${editMemberConflicts} → ${newEditMemberConflicts}`);
    console.log(`   showEditMemberModal conflicts: ${showEditMemberModalConflicts} → ${newShowEditMemberModalConflicts}`);

    if (newEditMemberConflicts === 0 && newShowEditMemberModalConflicts === 0) {
        console.log('\n🎉 SUCCESS! All function conflicts have been resolved.');
        console.log('✅ Member editing should now work properly.');
        console.log('\n📋 Next steps:');
        console.log('   1. Refresh your admin panel in the browser');
        console.log('   2. Test member editing functionality');
        console.log('   3. Check browser console for success messages');
    } else {
        console.log('\n⚠️ Some conflicts may still exist. Manual review may be needed.');
    }

} catch (error) {
    console.error('❌ Error during fix:', error.message);
    process.exit(1);
}
