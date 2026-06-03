$f = 'frontend\components\SegmentTreePath.tsx'
$c = [System.IO.File]::ReadAllText($f)
$old = "    main()" + "\" + [char]96
$new = "    main()" + [char]96
$c2 = $c.Replace($old, $new)
[System.IO.File]::WriteAllText($f, $c2)
Write-Host "Done. Replacements: $(($c.Length - $c2.Length))"
