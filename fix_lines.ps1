$f = 'frontend\components\SegmentTreePath.tsx'
$lines = Get-Content $f
# Keep lines before 3130 (index 3129) and from 3336 onwards (index 3335)
$kept = $lines[0..3128] + $lines[3335..($lines.Length-1)]
Set-Content $f $kept
Write-Host "Done. New count: $($kept.Length)"
