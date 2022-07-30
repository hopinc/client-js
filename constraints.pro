gen_workspace_field(WorkspaceCwd, 'description').
gen_enforced_field(WorkspaceCwd, 'license', 'MIT').
gen_enforced_field(WorkspaceCwd, 'repository', 'https://github.com/hopinc/hop-client-js.git').
gen_enforced_field(WorkspaceCwd, 'author', 'Hop Development Team').
gen_enforced_field(WorkspaceCwd, 'keywords', ['realtime', 'channels', 'pipe', 'client', 'react']).
gen_enforced_field(WorkspaceCwd, 'packageManager', 'yarn@3.2.1').
gen_enforced_field(WorkspaceCwd, 'version', '1.0.9').
gen_enforced_field(WorkspaceCwd, 'homepage', Homepage) :-
  workspace_field(WorkspaceCwd, 'version', _),
  atom_concat('https://github.com/hopinc/hop-client-js/tree/master/', WorkspaceCwd, Homepage).