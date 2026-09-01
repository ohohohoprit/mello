Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Collections.Generic;
public class WinEnum {
  [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc cb, IntPtr lp);
  [DllImport("user32.dll")] static extern int GetWindowText(IntPtr h, StringBuilder sb, int n);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  delegate bool EnumWindowsProc(IntPtr h, IntPtr lp);
  public static List<string> List(uint target) {
    var res = new List<string>();
    EnumWindows((h, lp) => {
      uint pid; GetWindowThreadProcessId(h, out pid);
      if (pid == target && IsWindowVisible(h)) {
        var sb = new StringBuilder(256); GetWindowText(h, sb, 256);
        res.Add(h.ToInt64().ToString() + " | '" + sb.ToString() + "'");
      }
      return true;
    }, IntPtr.Zero);
    return res;
  }
}
"@
$procs = Get-Process -Name electron -ErrorAction SilentlyContinue
foreach ($p in $procs) {
  $wins = [WinEnum]::List([uint32]$p.Id)
  if ($wins.Count -gt 0) {
    Write-Output ("PID " + $p.Id + ": " + $wins.Count + " windows")
    $wins | ForEach-Object { Write-Output ("  " + $_) }
  }
}
