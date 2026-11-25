"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import type { OnboardingUser, UserRole } from "@/lib/api/types";
import { formatShortDate, formatTimestamp } from "@/lib/dates";
import { userInitials, userRoleLabels, userStatusLabels } from "@/lib/onboarding";
import { AddTeamMemberModal } from "./add-team-member-modal";
import { ChevronRightIcon, PlusIcon, SearchIcon } from "./team-icons";

type SortOrder = "alphabetical" | "recent";
type AttentionTone = "danger" | "success" | "warning" | "muted";

type TeamDirectoryProps = {
  users: OnboardingUser[];
  approvedDomains: string[];
};

const roleTabs: { role: UserRole; label: string }[] = [
  { role: "passport_worker", label: "Passport workers" },
  { role: "admin", label: "Admins" },
];

function attentionFor(user: OnboardingUser): { label: string; tone: AttentionTone } {
  if (user.status === "invited") return { label: "Invite pending", tone: "warning" };
  if (user.status === "suspended") return { label: "Sign-in paused", tone: "danger" };
  if (user.status === "deactivated") return { label: "Deactivated", tone: "muted" };
  if (user.role === "passport_worker" && user.open_assignment_count === 0) {
    return { label: "No participants", tone: "warning" };
  }
  if (!user.training_acknowledgement) return { label: "Training due", tone: "warning" };
  return { label: "On track", tone: "success" };
}

function lastUpdate(user: OnboardingUser): string {
  return user.training_acknowledgement?.acknowledged_at ?? user.invited_at;
}

export function TeamDirectory({ users, approvedDomains }: TeamDirectoryProps) {
  const [activeRole, setActiveRole] = useState<UserRole>("passport_worker");
  const [query, setQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("alphabetical");
  const [inviteOpen, setInviteOpen] = useState(false);
  const closeInvite = useCallback(() => setInviteOpen(false), []);

  const counts = useMemo(() => ({
    passport_worker: users.filter((user) => user.role === "passport_worker").length,
    admin: users.filter((user) => user.role === "admin").length,
  }), [users]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = users.filter((user) => {
      if (user.role !== activeRole) return false;
      if (!normalizedQuery) return true;
      return user.display_name.toLowerCase().includes(normalizedQuery)
        || user.email.toLowerCase().includes(normalizedQuery);
    });

    return filtered.toSorted((a, b) => {
      if (sortOrder === "recent") return b.invited_at.localeCompare(a.invited_at);
      return a.display_name.localeCompare(b.display_name);
    });
  }, [activeRole, query, sortOrder, users]);

  const roleCount = counts[activeRole];
  const emptyRole = roleCount === 0;
  const emptySearch = !emptyRole && rows.length === 0;

  return <>
    <header className="team-header">
      <div className="team-header-copy">
        <p className="stub-eyebrow">Torchlight Admin · Staff access</p>
        <h1>Team</h1>
        <p>Invite staff, review account status, and keep onboarding and training on track.</p>
      </div>
      <div className="team-header-actions">
        <button className="team-add-button" onClick={() => setInviteOpen(true)} type="button">
          <PlusIcon />
          Add team member
        </button>
      </div>
    </header>

    <section className="team-panel" aria-labelledby="team-directory-title">
      <h2 className="onboarding-sr-only" id="team-directory-title">Team directory</h2>

      <div className="team-tabs" role="tablist" aria-label="Team roles">
        {roleTabs.map((tab) => {
          const selected = activeRole === tab.role;
          return <button
            aria-controls={selected ? `team-panel-${tab.role}` : undefined}
            aria-selected={selected}
            className={`team-tab${selected ? " is-active" : ""}`}
            id={`team-tab-${tab.role}`}
            key={tab.role}
            onClick={() => setActiveRole(tab.role)}
            role="tab"
            tabIndex={selected ? 0 : -1}
            type="button"
          >
            {tab.label}
            <span className="team-tab-count">{counts[tab.role]}</span>
          </button>;
        })}
      </div>

      <div
        aria-labelledby={`team-tab-${activeRole}`}
        className="team-panel-body"
        id={`team-panel-${activeRole}`}
        role="tabpanel"
      >
        <div className="team-toolbar">
          <label className="team-search">
            <SearchIcon />
            <span className="onboarding-sr-only">Search team members</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or email"
              type="search"
              value={query}
            />
          </label>
          <label className="team-sort">
            <span>Sort:</span>
            <select
              aria-label="Sort team members"
              onChange={(event) => setSortOrder(event.target.value as SortOrder)}
              value={sortOrder}
            >
              <option value="alphabetical">Alphabetical</option>
              <option value="recent">Recently invited</option>
            </select>
          </label>
        </div>

        {emptyRole ? (
          <div className="team-empty">
            <h3>No {activeRole === "admin" ? "admins" : "passport workers"} yet</h3>
            <p>Add the first {activeRole === "admin" ? "admin" : "passport worker"} to start tracking onboarding and training.</p>
            <button className="team-empty-action" onClick={() => setInviteOpen(true)} type="button">
              <PlusIcon />
              Add team member
            </button>
          </div>
        ) : emptySearch ? (
          <div className="team-empty">
            <h3>No team members match “{query.trim()}”</h3>
            <p>Try a different name or email address.</p>
            <button className="team-empty-action" onClick={() => setQuery("")} type="button">Clear search</button>
          </div>
        ) : (
          <>
            <div className="team-table-wrap">
              <table className="team-table">
                <caption className="onboarding-sr-only">
                  {activeRole === "admin" ? "Admin accounts" : "Passport worker accounts"}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Participants</th>
                    <th scope="col">Needs attention</th>
                    <th scope="col">Last update</th>
                    <th scope="col"><span className="onboarding-sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((user) => {
                    const attention = attentionFor(user);
                    const updatedAt = lastUpdate(user);
                    return <tr key={user.id}>
                      <td>
                        <div className="team-person">
                          <span className="team-avatar" aria-hidden="true">{userInitials(user.display_name)}</span>
                          <div>
                            <Link className="team-person-name" href={`/admin/team/${user.id}`}>{user.display_name}</Link>
                            <span className="team-person-role">{userRoleLabels[user.role]}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="team-email">{user.email}</span></td>
                      <td>
                        {user.role === "admin"
                          ? <span className="team-not-applicable">—</span>
                          : <span>{user.open_assignment_count} participant{user.open_assignment_count === 1 ? "" : "s"}</span>}
                      </td>
                      <td>
                        <span className={`team-attention is-${attention.tone}`}>{attention.label}</span>
                      </td>
                      <td>
                        <time className="team-last-update" dateTime={updatedAt} title={formatTimestamp(updatedAt)}>
                          {formatShortDate(updatedAt)}
                        </time>
                        <span className="team-last-update-label">
                          {user.training_acknowledgement ? "Training" : userStatusLabels[user.status]}
                        </span>
                      </td>
                      <td>
                        <Link
                          aria-label={`Open ${user.display_name}'s onboarding`}
                          className="team-row-chevron"
                          href={`/admin/team/${user.id}`}
                        >
                          <ChevronRightIcon />
                        </Link>
                      </td>
                    </tr>;
                  })}
                </tbody>
              </table>
            </div>
            <p className="team-result-count" role="status">
              Showing {rows.length} of {roleCount} {roleCount === 1 ? "person" : "people"}
            </p>
          </>
        )}
      </div>
    </section>

    {inviteOpen && <AddTeamMemberModal approvedDomains={approvedDomains} onClose={closeInvite} />}
  </>;
}
