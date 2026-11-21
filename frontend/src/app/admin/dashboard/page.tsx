import type { Metadata } from "next";
import Link from "next/link";
import type { Money } from "@/lib/api/types";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = {
  title: "Admin dashboard · Torchlight Passport",
};

const money = (value: string) => value as Money;

type ParticipantStatus = "active" | "follow-up" | "review";

const participants: {
  name: string;
  clientCode: string;
  agency: string;
  allocated: Money;
  spent: Money;
  available: Money;
  status: ParticipantStatus;
  usedPercent: number;
}[] = [
  { name: "Alex Sample", clientCode: "DEMO-001", agency: "Community Living", allocated: money("12500.00"), spent: money("4388.00"), available: money("8112.00"), status: "active", usedPercent: 35 },
  { name: "Jordan Placeholder", clientCode: "DEMO-002", agency: "Regional Health", allocated: money("9800.00"), spent: money("6280.00"), available: money("3520.00"), status: "follow-up", usedPercent: 64 },
  { name: "Riley Example", clientCode: "DEMO-003", agency: "Provincial Services", allocated: money("15600.00"), spent: money("11230.00"), available: money("4370.00"), status: "review", usedPercent: 72 },
  { name: "Morgan Sample", clientCode: "DEMO-004", agency: "Community Living", allocated: money("7200.00"), spent: money("2015.00"), available: money("5185.00"), status: "active", usedPercent: 28 },
  { name: "Casey Placeholder", clientCode: "DEMO-005", agency: "Coastal Health", allocated: money("10400.00"), spent: money("5610.00"), available: money("4790.00"), status: "active", usedPercent: 54 },
  { name: "Taylor Example", clientCode: "DEMO-006", agency: "Regional Health", allocated: money("8800.00"), spent: money("8005.00"), available: money("795.00"), status: "follow-up", usedPercent: 91 },
];

const statusLabels: Record<ParticipantStatus, string> = {
  active: "Active",
  "follow-up": "Follow-up",
  review: "Review",
};

const attentionItems = [
  { title: "Receipt missing", detail: "Jordan Placeholder · submitted 2 days ago", tone: "danger" },
  { title: "Invoice needs review", detail: "Taylor Example · overage flagged", tone: "warning" },
  { title: "Allocation check", detail: "Riley Example · 72% used", tone: "info" },
];

const activityItems = [
  { title: "Receipt uploaded", detail: "Alex Sample · Community activities", when: "9:14 AM", dateTime: "2026-11-21T09:14:00Z", tone: "success" },
  { title: "Invoice generated", detail: "Morgan Sample · November", when: "Yesterday", dateTime: "2026-11-20", tone: "brand" },
  { title: "Funding updated", detail: "Casey Placeholder · Regional Health", when: "Nov 19", dateTime: "2026-11-19", tone: "brand" },
];

const followUpItems = [
  { title: "Confirm respite invoice", detail: "Riley Example · A. Admin", when: "Due today", tone: "warning", owner: "AA" },
  { title: "Review mileage receipt", detail: "Taylor Example · J. Worker", when: "Tomorrow", tone: "info", owner: "JW" },
  { title: "Confirm agency split", detail: "Jordan Placeholder · A. Admin", when: "This week", tone: "muted", owner: "AA" },
];

const developerTasks = [
  "Load all authorized users and participants; support opening a selected participant profile.",
  "Build recent activity from auditable events such as receipt uploads, expense updates, and invoice status changes.",
  "Calculate funding amount, where funding is allocated, and funding spent from approved records.",
  "Add a follow-up inbox for missing/unclear receipts and client/staff notes.",
  "Replace these synthetic preview records with API-backed data before release.",
];

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

export default function AdminDashboard() {
  return <main className="admin-dash">
    <header className="admin-dash-header">
      <div>
        <p className="admin-dash-eyebrow">Torchlight Admin · Overview</p>
        <h1>Good morning, <span>Admin</span></h1>
        <p className="admin-dash-lede">Here’s what’s happening across your participants and funding today.</p>
      </div>
      <div className="admin-dash-actions">
        <span className="admin-dash-preview"><i aria-hidden="true" />Preview data</span>
        <Link className="admin-dash-secondary" href="/admin/participants">Participants</Link>
        <Link className="admin-dash-primary" href="/onboarding">Invite worker</Link>
      </div>
    </header>

    <section className="admin-dash-overview" aria-label="Workspace overview">
      <article className="admin-dash-card">
        <div className="admin-dash-card-head">
          <div><h2>Needs attention</h2><p>Items that need a decision</p></div>
          <span className="admin-dash-count is-warning">{attentionItems.length}</span>
        </div>
        <ul className="admin-dash-list">
          {attentionItems.map((item) => <li key={item.title}>
            <span className={`admin-dash-list-dot is-${item.tone}`} aria-hidden="true" />
            <div className="admin-dash-list-copy"><strong>{item.title}</strong><span>{item.detail}</span></div>
          </li>)}
        </ul>
        <Link className="admin-dash-card-footer" href="/admin/ocr-review">Open follow-up queue <span aria-hidden="true">→</span></Link>
      </article>

      <article className="admin-dash-card">
        <div className="admin-dash-card-head">
          <div><h2>Recent activity</h2><p>Latest changes across the workspace</p></div>
        </div>
        <ul className="admin-dash-list">
          {activityItems.map((item) => <li key={item.title}>
            <span className={`admin-dash-list-dot is-${item.tone}`} aria-hidden="true" />
            <div className="admin-dash-list-copy"><strong>{item.title}</strong><span>{item.detail}</span></div>
            <time className="admin-dash-list-time" dateTime={item.dateTime}>{item.when}</time>
          </li>)}
        </ul>
        <Link className="admin-dash-card-footer" href="/admin/reports">Open activity log <span aria-hidden="true">→</span></Link>
      </article>

      <article className="admin-dash-card">
        <div className="admin-dash-card-head">
          <div><h2>Follow-ups</h2><p>Owned items due soon</p></div>
        </div>
        <ul className="admin-dash-list">
          {followUpItems.map((item) => <li key={item.title}>
            <span className="admin-dash-avatar" aria-hidden="true">{item.owner}</span>
            <div className="admin-dash-list-copy"><strong>{item.title}</strong><span>{item.detail}</span></div>
            <span className={`admin-dash-due is-${item.tone}`}>{item.when}</span>
          </li>)}
        </ul>
        <Link className="admin-dash-card-footer" href="/admin/participants">View participant follow-ups <span aria-hidden="true">→</span></Link>
      </article>
    </section>

    <section className="admin-dash-panel" aria-labelledby="admin-participants-title">
      <header className="admin-dash-panel-head">
        <div>
          <div className="admin-dash-panel-title">
            <h2 id="admin-participants-title">Participants</h2>
            <span className="admin-dash-count">{participants.length}</span>
          </div>
          <p>Current fiscal year funding across the participant roster.</p>
        </div>
        <div className="admin-dash-panel-actions">
          <span className="admin-dash-filter">All agencies</span>
          <Link className="admin-dash-text-link" href="/admin/participants">View directory <span aria-hidden="true">→</span></Link>
        </div>
      </header>
      <div className="admin-dash-table-wrap">
        <table className="admin-dash-table">
          <thead>
            <tr>
              <th scope="col">Participant</th>
              <th scope="col">Managing agency</th>
              <th scope="col">Allocated</th>
              <th scope="col">Spent</th>
              <th scope="col">Available</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {participants.map((participant) => {
              const meterTone = participant.usedPercent >= 90 ? " is-danger" : participant.usedPercent >= 70 ? " is-warning" : "";

              return <tr key={participant.clientCode}>
                <td>
                  <div className="admin-dash-participant">
                    <span className="admin-dash-participant-avatar" aria-hidden="true">{initials(participant.name)}</span>
                    <div><strong>{participant.name}</strong><small>{participant.clientCode}</small></div>
                  </div>
                </td>
                <td>{participant.agency}</td>
                <td><span className="admin-dash-amount">{formatMoney(participant.allocated)}</span></td>
                <td>
                  <div className="admin-dash-spend">
                    <span className="admin-dash-amount">{formatMoney(participant.spent)}</span>
                    <span className={`admin-dash-meter${meterTone}`} aria-hidden="true"><i style={{ width: `${Math.min(participant.usedPercent, 100)}%` }} /></span>
                  </div>
                </td>
                <td><span className="admin-dash-amount is-available">{formatMoney(participant.available)}</span></td>
                <td><span className={`admin-dash-status admin-dash-status-${participant.status}`}>{statusLabels[participant.status]}</span></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </section>

    <p className="admin-dash-footnote">Preview data only · synthetic participants and funding · CAD.</p>
    <details className="admin-dash-notes">
      <summary>Implementation notes</summary>
      <ul>{developerTasks.map((task) => <li key={task}>{task}</li>)}</ul>
    </details>
  </main>;
}
