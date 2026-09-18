package main

# Block obviously unsafe compose patterns for this lab stack.

deny[msg] {
	some s
	input.services[s].privileged == true
	msg := sprintf("service %q must not set privileged: true", [s])
}

deny[msg] {
	some s
	input.services[s].network_mode == "host"
	msg := sprintf("service %q must not use network_mode: host", [s])
}

deny[msg] {
	some s
	input.services[s].pid == "host"
	msg := sprintf("service %q must not set pid: host", [s])
}

# Container hardening floor: every service must run with no Linux
# capabilities, no privilege escalation, and a read-only root filesystem.
# Catches a silent regression (e.g. someone dropping `read_only: true` while
# editing the compose file) instead of only catching it in a later manual review.

cap_drop_all[s] {
	some s
	input.services[s].cap_drop[_] == "ALL"
}

deny[msg] {
	some s
	input.services[s]
	not cap_drop_all[s]
	msg := sprintf("service %q must set cap_drop: [ALL]", [s])
}

no_new_privileges[s] {
	some s
	input.services[s].security_opt[_] == "no-new-privileges:true"
}

deny[msg] {
	some s
	input.services[s]
	not no_new_privileges[s]
	msg := sprintf("service %q must set security_opt: [no-new-privileges:true]", [s])
}

deny[msg] {
	some s
	input.services[s]
	input.services[s].read_only != true
	msg := sprintf("service %q must set read_only: true", [s])
}
