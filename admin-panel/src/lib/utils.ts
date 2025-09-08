import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(new Date(date));
}

export function formatNumber(num: number) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

export function generateCSV(data: any[], filename: string) {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header];
      if (typeof value === "object" && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(",")
  );
  
  const csvContent = [csvHeaders, ...csvRows].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function downloadJSON(data: any, filename: string) {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
