export const NAV_ITEMS = [
  { icon: "public", label: "Orbital Görünüm", route: "/" },
  { icon: "wb_sunny", label: "Güneş Patlamaları", route: "/solar-flares" },
  { icon: "satellite_alt", label: "Uydu Risk", route: "/satellite-risk" },
  { icon: "insights", label: "Tahminler", route: "/predictions" },
  { icon: "speed", label: "Telemetri", route: "/telemetry" },
  { icon: "warning", label: "Risk Analizi", route: "/risk-analysis" },
  { icon: "terminal", label: "Sistem Logları", route: "/system-logs" },
  { icon: "notifications", label: "Bildirimler", route: "/notifications" },
  { icon: "settings", label: "Ayarlar", route: "/settings" },
]

export const RISK_TYPE_LABELS = {
  surface_charging: "Yüzey Şarjlanması (Surface Charging)",
  atmospheric_drag: "Atmosferik Sürükleme (Atmospheric Drag)",
}

export const ASSET_TYPE_LABELS = {
  power_grid: "Güç Şebekesi Ana Trafo",
  satellite_control: "TT&C İstasyonu (Telemetry, Tracking & Command)",
  research_station: "Araştırma İstasyonu",
}
