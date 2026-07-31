"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, Bell, FileText, Server, Save } from "lucide-react";

interface NotifToggle {
  key: string;
  label: string;
  description: string;
}

const notifToggles: NotifToggle[] = [
  { key: "lowFeed", label: "Low Feed Stock Alert", description: "Notify when feed stock falls below reorder level" },
  { key: "highMortality", label: "High Mortality Alert", description: "Notify when daily mortality exceeds 5 birds/shed" },
  { key: "vaccinationDue", label: "Vaccination Reminders", description: "Remind 7 days before scheduled vaccination date" },
  { key: "medicineExpiry", label: "Medicine Expiry Warning", description: "Alert when medicine expires within 30 days" },
  { key: "lowProduction", label: "Low Production Warning", description: "Alert when daily production drops below target %" },
  { key: "paymentOverdue", label: "Overdue Payment Alert", description: "Notify when customer payment is overdue by 7+ days" },
  { key: "dailyBackup", label: "Daily Backup Confirmation", description: "Send confirmation after each successful backup" },
  { key: "newSale", label: "New Sale Notifications", description: "Notify on every new sale invoice created" },
];

export default function SettingsPage() {
  const [defaultFarm, setDefaultFarm] = useState("green-valley");
  const [currency, setCurrency] = useState("PKR");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [reportPeriod, setReportPeriod] = useState("monthly");
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [emailReports, setEmailReports] = useState(false);
  const [saved, setSaved] = useState(false);

  const [notifs, setNotifs] = useState<Record<string, boolean>>(
    Object.fromEntries(notifToggles.map((t) => [t.key, t.key !== "newSale" && t.key !== "dailyBackup"]))
  );

  function toggleNotif(key: string) {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <>
      <Header title="Settings" />
      <main className="flex-1 p-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Farm Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Settings className="h-4 w-4 text-primary" />
                Farm Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Farm</Label>
                <Select value={defaultFarm} onValueChange={(v) => v && setDefaultFarm(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="green-valley">Green Valley Farm</SelectItem>
                    <SelectItem value="sunrise">Sunrise Poultry</SelectItem>
                    <SelectItem value="alnoor">Al-Noor Farm</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Dashboard and reports default to this farm</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Currency</Label>
                <Select value={currency} onValueChange={(v) => v && setCurrency(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR — Pakistani Rupee (₨)</SelectItem>
                    <SelectItem value="USD">USD — US Dollar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Timezone</Label>
                <Select value={timezone} onValueChange={(v) => v && setTimezone(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Asia/Karachi">Asia/Karachi (PKT, UTC+5)</SelectItem>
                    <SelectItem value="Asia/Lahore">Asia/Lahore (PKT, UTC+5)</SelectItem>
                    <SelectItem value="UTC">UTC+0</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Farm Owner Name</Label>
                <Input className="h-8 text-xs" defaultValue="Muhammad Faisal" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Contact Number</Label>
                <Input className="h-8 text-xs" defaultValue="+92 300 1234567" />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Production % Target (per shed)</Label>
                <Input type="number" className="h-8 text-xs" defaultValue="85" />
                <p className="text-[11px] text-muted-foreground">Alerts trigger when shed drops below this target</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Egg Tray Size (eggs per tray)</Label>
                <Input type="number" className="h-8 text-xs" defaultValue="30" />
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Bell className="h-4 w-4 text-primary" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {notifToggles.map((t) => (
                <div
                  key={t.key}
                  className="flex items-start gap-3 rounded-md p-3 hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    id={t.key}
                    checked={notifs[t.key]}
                    onChange={() => toggleNotif(t.key)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary accent-primary cursor-pointer"
                  />
                  <label htmlFor={t.key} className="cursor-pointer">
                    <p className="text-xs font-medium text-foreground">{t.label}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{t.description}</p>
                  </label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Report Settings */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <FileText className="h-4 w-4 text-primary" />
                Report Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Default Report Period</Label>
                <Select value={reportPeriod} onValueChange={(v) => v && setReportPeriod(v)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start gap-3 rounded-md p-3 bg-muted/30">
                <input
                  type="checkbox"
                  id="auto-generate"
                  checked={autoGenerate}
                  onChange={() => setAutoGenerate(!autoGenerate)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                />
                <label htmlFor="auto-generate" className="cursor-pointer">
                  <p className="text-xs font-medium text-foreground">Auto-generate Daily Report</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Automatically generate and save daily production report at midnight
                  </p>
                </label>
              </div>

              <div className="flex items-start gap-3 rounded-md p-3 bg-muted/30">
                <input
                  type="checkbox"
                  id="email-reports"
                  checked={emailReports}
                  onChange={() => setEmailReports(!emailReports)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary cursor-pointer"
                />
                <label htmlFor="email-reports" className="cursor-pointer">
                  <p className="text-xs font-medium text-foreground">Email Reports to Owner</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Send auto-generated reports to the owner&apos;s email address
                  </p>
                </label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Report Email Address</Label>
                <Input
                  type="email"
                  className="h-8 text-xs"
                  defaultValue="faisal@greenvallyfarm.pk"
                  disabled={!emailReports}
                />
              </div>
            </CardContent>
          </Card>

          {/* System Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Server className="h-4 w-4 text-primary" />
                System Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Application Version", value: "v1.0.0", badge: null },
                { label: "Database Status", value: "Connected", badge: "green" },
                { label: "Last Backup", value: "Today, 02:00 AM", badge: "green" },
                { label: "Next Backup", value: "Tomorrow, 02:00 AM", badge: null },
                { label: "Server Environment", value: "Production", badge: null },
                { label: "Total Records", value: "12,840 entries", badge: null },
                { label: "Data Retention", value: "24 months", badge: null },
                { label: "Storage Used", value: "2.4 GB / 10 GB", badge: null },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <div className="flex items-center gap-2">
                    {row.badge === "green" && (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px]">
                        OK
                      </Badge>
                    )}
                    <span className="text-xs font-medium text-foreground">{row.value}</span>
                  </div>
                </div>
              ))}

              <div className="pt-2 flex gap-2">
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                  Run Backup Now
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
                  Clear Cache
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className={`inline-flex items-center gap-2 rounded-md px-5 py-2 text-sm font-medium transition-colors ${
              saved
                ? "bg-green-600 text-white"
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            }`}
          >
            <Save className="h-4 w-4" />
            {saved ? "Settings Saved!" : "Save Settings"}
          </button>
        </div>
      </main>
    </>
  );
}
