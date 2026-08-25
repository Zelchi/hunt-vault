import { MetaProvider, Title } from "@solidjs/meta";
import { createSignal, lazy } from "solid-js";
import { Toaster, toast } from "solid-toast";
import { database } from "@/lib/database";
import { detectHuntReportType } from "@/lib/hunt-detector";
import { validateHuntReport } from "@/lib/hunt-parser";
import { validateHuntPartyReport } from "@/lib/hunt-party";
import type { HuntRecord, View } from "@/types/hunt";

const AppShell = lazy(() => import("@/components/AppShell"));
const HuntImporter = lazy(() => import("@/components/HuntImporter"));
const HuntViewer = lazy(() => import("@/components/HuntViewer"));

export default () => {
	const [clipboardText, setClipboardText] = createSignal("");
	const [readingClipboard, setReadingClipboard] = createSignal(false);
	const [saving, setSaving] = createSignal(false);
	const [deleting, setDeleting] = createSignal(false);
	const [view, setView] = createSignal<View>("import");
	const [history, setHistory] = createSignal<HuntRecord[]>([]);
	const [loadingHistory, setLoadingHistory] = createSignal(false);
	const [currentIndex, setCurrentIndex] = createSignal(0);

	const loadHistory = async () => {
		setLoadingHistory(true);

		try {
			const records = await database.hunts.orderBy("createdAt").reverse().toArray();
			setHistory(records);
			setCurrentIndex(0);
		} catch {
			toast.error("Não foi possível carregar o histórico.");
		} finally {
			setLoadingHistory(false);
		}
	};

	const handleViewChange = (nextView: View) => {
		setView(nextView);

		if (nextView === "visualize") {
			void loadHistory();
		}
	};

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

			if (reportType === "individual") {
				const validation = validateHuntReport(text);

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
			const record: HuntRecord = {
				id: crypto.randomUUID(),
				createdAt: new Date().toISOString(),
				rawText,
			};

			await database.hunts.add(record);
			setHistory((records) => [record, ...records]);
			setCurrentIndex(0);
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
			setCurrentIndex((index) => {
				if (remainingRecords.length === 0) {
					return 0;
				}

				if (deletedIndex < index) {
					return index - 1;
				}

				return Math.min(index, remainingRecords.length - 1);
			});
			toast.success("Caçada excluída do histórico.");
		} catch {
			toast.error("Não foi possível excluir a caçada.");
		} finally {
			setDeleting(false);
		}
	};

	const showPreviousHunt = () => {
		setCurrentIndex((index) => {
			return history().length === 0 ? 0 : (index - 1 + history().length) % history().length;
		});
	};

	const showNextHunt = () => {
		setCurrentIndex((index) => (history().length === 0 ? 0 : (index + 1) % history().length));
	};

	return (
		<MetaProvider>
			<Title>{view() === "import" ? "Importar" : "Visualizar"} | HuntVault</Title>
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
					<HuntViewer
						history={history()}
						currentIndex={currentIndex()}
						loading={loadingHistory()}
						deleting={deleting()}
						onPrevious={showPreviousHunt}
						onNext={showNextHunt}
						onImport={() => setView("import")}
						onDelete={(id) => {
							void deleteHunt(id);
						}}
					/>
				)}
			</AppShell>
		</MetaProvider>
	);
};
