const fs = require('fs');

console.log('🔧 Removing problematic editMember function overrides...');

try {
    const content = fs.readFileSync('js/admin.js', 'utf8');
    console.log('📊 Current file size:', content.length, 'characters');

    // Remove the problematic function overrides
    let cleanedContent = content;

    // Remove the v12 override (lines around 12654-12753)
    const v12Pattern = /\/\/ Replace the existing editMember with a multi-base version[\s\S]*?console\.log\('✅ NARAP v12 override active \(multi-base \+ extended fallbacks\)'\);/;
    cleanedContent = cleanedContent.replace(v12Pattern, '');

    // Remove other problematic overrides
    const overridePatterns = [
        /const orig = window\.editMember;[\s\S]*?window\.editMember = function\(ev\)\{[\s\S]*?\};/g,
        /const prevEdit = window\.editMember;[\s\S]*?window\.editMember = async function\(ev\)\{[\s\S]*?\};/g
    ];

    overridePatterns.forEach((pattern, index) => {
        const matches = cleanedContent.match(pattern);
        if (matches) {
            console.log(`🗑️ Removed override pattern ${index + 1}:`, matches.length, 'matches');
            cleanedContent = cleanedContent.replace(pattern, '');
        }
    });

    // Write the cleaned file
    fs.writeFileSync('js/admin.js', cleanedContent, 'utf8');

    console.log('✅ Successfully removed editMember function overrides');
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
    const remainingAssignments = cleanedContent.match(/window\.editMember\s*=/g);
    if (remainingAssignments) {
        console.log('⚠️ Remaining window.editMember assignments:', remainingAssignments.length);
        console.log('These should only be the original assignment at line ~8720');
    } else {
        console.log('✅ No remaining window.editMember assignments found');
    }

} catch (error) {
    console.error('❌ Error cleaning file:', error.message);
    process.exit(1);
}
