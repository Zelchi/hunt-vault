import * as styles from "@/styles/app-shell.css";
import type { View } from "@/types/hunt-common";

type NavbarProps = {
	view: View;
	onViewChange: (view: View) => void;
};

export default (props: NavbarProps) => {
	return (
		<nav class={styles.nav} aria-label="Navegação principal">
			<button class={styles.navButton} data-active={props.view === "party"} type="button" onClick={() => props.onViewChange("party")}>
				Party
			</button>
			<button
				class={styles.navButton}
				data-active={props.view === "import"}
				type="button"
				onClick={() => props.onViewChange("import")}
			>
				Import
			</button>
		</nav>
	);
};
