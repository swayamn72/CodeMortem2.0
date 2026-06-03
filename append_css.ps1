$css = @"


/* ── react-resizable-panels resize handle glow ── */
[data-panel-resize-handle-enabled]:hover {
  background: var(--cm-cyan) !important;
  opacity: 0.65;
}
[data-panel-resize-handle-enabled][data-state="drag"] {
  background: var(--cm-cyan) !important;
  opacity: 0.9;
}
"@
Add-Content 'frontend/app/globals.css' $css
Write-Host "Done"
