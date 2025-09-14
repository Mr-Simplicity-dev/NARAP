const fs = require('fs');

console.log('🔧 Final cleanup: Removing all problematic editMember function overrides...');

try {
    const content = fs.readFileSync('js/admin.js', 'utf8');
    console.log('📊 Current file size:', content.length, 'characters');

    // Remove all problematic function overrides
    let cleanedContent = content;

    // Remove the v11 override (lines around 12382-12512)
    const v11Pattern = /\/\/ Patch the existing v10 override by replacing its window\.editMember with extended sequence[\s\S]*?console\.log\('✅ NARAP v11 override active \(extended POST fallbacks\)'\);/;
    cleanedContent = cleanedContent.replace(v11Pattern, '');

    // Remove the v12 multi-base override (lines around 12520-12753)
    const v12Pattern = /\/\* ===================== NARAP - All-in-One Edit Override \(v12 multi-base\) =====================[\s\S]*?console\.log\('✅ NARAP v12 override active \(multi-base \+ extended fallbacks\)'\);/;
    cleanedContent = cleanedContent.replace(v12Pattern, '');

    // Remove any remaining window.editMember assignments except the original one at line ~8720
    const remainingAssignments = cleanedContent.match(/window\.editMember\s*=/g);
    if (remainingAssignments && remainingAssignments.length > 1) {
        console.log('⚠️ Found multiple window.editMember assignments, removing problematic ones...');
        
        // Keep only the first assignment (the original one)
        let firstAssignment = true;
        cleanedContent = cleanedContent.replace(/window\.editMember\s*=/g, (match) => {
            if (firstAssignment) {
                firstAssignment = false;
                return match; // Keep the first one
            } else {
                return '// REMOVED: ' + match; // Comment out the rest
            }
        });
    }

    // Write the cleaned file
    fs.writeFileSync('js/admin.js', cleanedContent, 'utf8');

    console.log('✅ Successfully removed all problematic editMember function overrides');
    console.log('📊 Original size:', content.length, 'characters');
    console.log('📊 Clean size:', cleanedContent.length, 'characters');
    console.log('🗑️ Removed:', content.length - cleanedContent.length, 'characters');

    // Verify the original editMember function still exists
    const originalFunction = cleanedContent.match(/async function editMember\(event\)/);
    if (originalFunction) {
        console.log('✅ Original editMember function preserved');
    } else {
        console.log('❌ Warning: Original editMember function not found');
    }

    // Check for remaining window.editMember assignments
    const finalAssignments = cleanedContent.match(/window\.editMember\s*=/g);
    if (finalAssignments) {
        console.log('📋 Remaining window.editMember assignments:', finalAssignments.length);
        if (finalAssignments.length === 1) {
            console.log('✅ Only the original assignment remains - this is correct!');
        } else {
            console.log('⚠️ Multiple assignments still exist - manual cleanup may be needed');
        }
    } else {
        console.log('❌ No window.editMember assignments found - this may cause issues');
    }

    // Check for any remaining POST method overrides
    const postOverrides = cleanedContent.match(/method.*POST.*method=PUT/g);
    if (postOverrides) {
        console.log('⚠️ Found POST method overrides:', postOverrides.length);
        console.log('These should be removed to fix the 405 error');
    } else {
        console.log('✅ No POST method overrides found');
    }

} catch (error) {
    console.error('❌ Error cleaning file:', error.message);
    process.exit(1);
}

