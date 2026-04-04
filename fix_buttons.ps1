$dir = "d:\itr-app\client\src"
$files = Get-ChildItem -Path $dir -Recurse -Filter "*.tsx" | Select-Object -ExpandProperty FullName
$count = 0

foreach ($f in $files) {
    $c = [System.IO.File]::ReadAllText($f)
    $n = $c

    # Variant 1: borderRadius: 2
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none'",
        "bgcolor: '#111827', color: 'white', '&:hover': { bgcolor: '#1f2937' }, textTransform: 'none', borderRadius: '8px', boxShadow: 'none', fontWeight: 600"
    )

    # Variant 2: boxShadow before hover
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }",
        "bgcolor: '#111827', color: 'white', textTransform: 'none', boxShadow: 'none', fontWeight: 600, '&:hover': { bgcolor: '#1f2937' }"
    )

    # Variant 3: borderRadius: 1.5
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 600",
        "bgcolor: '#111827', color: 'white', '&:hover': { bgcolor: '#1f2937' }, textTransform: 'none', borderRadius: '8px', boxShadow: 'none', fontWeight: 600"
    )

    # Variant 4: rgba 0.15 -> 0.25 no borderRadius specified
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.15)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' }, textTransform: 'none', borderRadius: 2, boxShadow: 'none'",
        "bgcolor: '#111827', color: 'white', '&:hover': { bgcolor: '#1f2937' }, textTransform: 'none', borderRadius: '8px', boxShadow: 'none', fontWeight: 600"
    )

    # Variant 5: rgba 0.2 -> 0.35 fontWeight 600
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.2)', color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' }, textTransform: 'none', fontWeight: 600",
        "bgcolor: '#111827', color: 'white', '&:hover': { bgcolor: '#1f2937' }, textTransform: 'none', fontWeight: 600"
    )

    # Variant 6: rgba 0.2 -> 0.35 textTransform none fontWeight 600 borderRadius 2
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.2)', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' }, boxShadow: 'none'",
        "bgcolor: '#111827', color: 'white', textTransform: 'none', fontWeight: 600, borderRadius: '8px', '&:hover': { bgcolor: '#1f2937' }, boxShadow: 'none'"
    )

    # Variant 7: rgba 0.22 -> 0.35 (Save button style)
    $n = $n.Replace(
        "bgcolor: 'rgba(255,255,255,0.22)', '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' }",
        "bgcolor: 'rgba(255,255,255,0.18)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' }"
    )

    if ($c -ne $n) {
        [System.IO.File]::WriteAllText($f, $n)
        $count++
        Write-Host "Updated: $f"
    }
}

Write-Host ""
Write-Host "Done. Total files updated: $count"
