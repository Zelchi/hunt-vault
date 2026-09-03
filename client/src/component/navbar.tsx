import * as styles from "@/style/app-shell.css";
import type { NavbarProps } from "@/type/components";

export default (props: NavbarProps) => {
	return (
		<nav class={styles.nav} aria-label="Navegação principal">
			<button
				class={styles.navButton}
				data-active={props.view === "party"}
				type="button"
				onClick={() => {
					return props.onViewChange("party");
				}}
			>
				Party
			</button>
			<button
				class={styles.navButton}
				data-active={props.view === "import"}
				type="button"
				onClick={() => {
					return props.onViewChange("import");
				}}
			>
				Import
			</button>
		</nav>
	);
};
