import { createSignal, lazy, onCleanup, onMount } from "solid-js";
import { Toaster, toast } from "solid-toast";

import { database } from "@/lib/database";
import { hasDuplicateHunt } from "@/lib/hunt-dedup";
import { detectHuntReportType } from "@/lib/hunt-detector";
import { validateHuntPartyReport } from "@/lib/hunt-party";
import { validateHuntSoloReport } from "@/lib/hunt-solo";
import type { HuntRecord, View } from "@/types/hunt-common";

const AppShell = lazy(() => import("@/components/app-shell"));
const HuntImporter = lazy(() => import("@/components/hunt-importer"));
const HuntDashboard = lazy(() => import("@/components/hunt-dashboard"));
const HuntViewer = lazy(() => import("@/components/hunt-viewer"));
const StorageErrorModal = lazy(() => import("@/components/error-modal"));
const lastViewStorageKey = "hunt-vault:last-view";

const getStoredView = (): View => {
	try {
		const storedView = localStorage.getItem(lastViewStorageKey);
		return storedView === "solo" || storedView === "party" || storedView === "import" ? storedView : "import";
	} catch {
		return "import";
	}
};

export default () => {
	const [clipboardText, setClipboardText] = createSignal("");
	const [readingClipboard, setReadingClipboard] = createSignal(false);
	const [saving, setSaving] = createSignal(false);
	const [deleting, setDeleting] = createSignal(false);
	const [view, setView] = createSignal<View>(getStoredView());
	const [history, setHistory] = createSignal<HuntRecord[]>([]);
	const [loadingHistory, setLoadingHistory] = createSignal(false);
	const [storageError, setStorageError] = createSignal(false);
	const clickSound = new Audio("/click.mp3");

	const checkDatabaseAccess = async () => {
		try {
			if (typeof indexedDB === "undefined") {
				throw new Error("IndexedDB não está disponível neste navegador.");
			}

			await database.open();
			await database.hunts.count();
		} catch {
			setStorageError(true);
		}
	};

	onMount(() => {
		void checkDatabaseAccess();
		if (view() !== "import") {
			void loadHistory();
		}

		const handleButtonClick = (event: MouseEvent) => {
			if (!(event.target instanceof Element) || !event.target.closest("button")) {
				return;
			}

			clickSound.currentTime = 0;
			clickSound.volume = 0.1;
			void clickSound.play().catch(() => undefined);
		};

		document.addEventListener("click", handleButtonClick);

		onCleanup(() => {
			document.removeEventListener("click", handleButtonClick);
			clickSound.pause();
			clickSound.currentTime = 0;
		});
	});

	const loadHistory = async () => {
		setLoadingHistory(true);

		try {
			const records = await database.hunts.orderBy("createdAt").reverse().toArray();
			setHistory(records);
		} catch {
			toast.error("Não foi possível carregar o histórico.");
		} finally {
			setLoadingHistory(false);
		}
	};

	const handleViewChange = (nextView: View) => {
		setView(nextView);

		localStorage.setItem(lastViewStorageKey, nextView);

		if (nextView === "solo" || nextView === "party") {
			void loadHistory();
		}
	};

	const activeCategory = () => (view() === "party" ? "party" : "solo");

	const readClipboard = async () => {
		if (!navigator.clipboard) {
			toast.error("Seu navegador não permite acessar o clipboard.");
			return;
		}

		setReadingClipboard(true);

		try {
			const text = await navigator.clipboard.readText();

			if (!text.trim()) {
				toast.error("O clipboard está vazio.");
				return;
			}

			const reportType = detectHuntReportType(text);

			if (reportType === "party") {
				const validation = validateHuntPartyReport(text);

				if (validation.errors.length > 0) {
					setClipboardText("");
					toast.error(`Formato não reconhecido: ${validation.errors[0]}.`);
					return;
				}

				setClipboardText(text);
				toast.success(
					`Party Hunt reconhecido: ${validation.parsed.members.length} membros e ${validation.parsed.metrics.length} métricas gerais.`,
				);
				return;
			}

			if (reportType === "solo") {
				const validation = validateHuntSoloReport(text);

				if (validation.errors.length > 0) {
					setClipboardText("");
					toast.error(`Formato não reconhecido: ${validation.errors[0]}.`);
					return;
				}

				setClipboardText(text);
				toast.success(
					`Hunt Analyser reconhecido: ${validation.parsed.metrics.length} métricas, ${validation.parsed.monsters.length} tipos de monstros e ${validation.parsed.lootedItems.length} tipos de itens.`,
				);
				return;
			}

			setClipboardText("");
			toast.error("Tipo de relatório não reconhecido.");
		} catch {
			toast.error("Não foi possível acessar o clipboard. Autorize o acesso e tente novamente.");
		} finally {
			setReadingClipboard(false);
		}
	};

	const saveHunt = async () => {
		const rawText = clipboardText();
		if (!rawText.trim()) return;

		setSaving(true);

		try {
			const existingHunts = await database.hunts.toArray();
			if (hasDuplicateHunt(existingHunts, rawText)) {
				toast.error("Esta caçada já foi importada anteriormente.");
				return;
			}

			const record: HuntRecord = {
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				rawText,
			};

			await database.hunts.add(record);
			setHistory((records) => [record, ...records]);
			setClipboardText("");
			toast.success("Resultado salvo no IndexedDB!");
		} catch {
			toast.error("Não foi possível salvar o resultado da caçada.");
		} finally {
			setSaving(false);
		}
	};

	const deleteHunt = async (id: string) => {
		const records = history();
		const deletedIndex = records.findIndex((record) => record.id === id);

		if (deletedIndex === -1) {
			return;
		}

		setDeleting(true);

		try {
			await database.hunts.delete(id);

			const deletedRecord = await database.hunts.get(id);
			if (deletedRecord) {
				throw new Error("O registro ainda existe no IndexedDB.");
			}

			const remainingRecords = records.filter((record) => record.id !== id);
			setHistory(remainingRecords);
			toast.success("Caçada excluída do histórico.");
		} catch {
			toast.error("Não foi possível excluir a caçada.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<Toaster position="bottom-right" />
			<AppShell view={view()} onViewChange={handleViewChange}>
				{view() === "import" ? (
					<HuntImporter
						clipboardText={clipboardText()}
						readingClipboard={readingClipboard()}
						saving={saving()}
						onReadClipboard={() => {
							void readClipboard();
						}}
						onSave={() => {
							void saveHunt();
						}}
					/>
				) : (
					<>
						<HuntDashboard history={history()} mode={activeCategory()} />
						<HuntViewer
							history={history()}
							initialCategory={activeCategory()}
							loading={loadingHistory()}
							deleting={deleting()}
							onImport={() => setView("import")}
							onDelete={(id) => {
								void deleteHunt(id);
							}}
						/>
					</>
				)}
			</AppShell>
			<StorageErrorModal open={storageError()} onClose={() => setStorageError(false)} />
		</>
	);
};
