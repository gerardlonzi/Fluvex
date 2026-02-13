export async function downloadExport(url: string, defaultFilename: string): Promise<boolean> {
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return false;
    const blob = await res.blob();
    const disp = res.headers.get("Content-Disposition");
    const match = disp && /filename="?([^"]+)"?/.exec(disp);
    const name = match ? match[1].trim() : defaultFilename;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
    return true;
  } catch {
    return false;
  }
}
