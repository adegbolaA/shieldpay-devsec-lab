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
