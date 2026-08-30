import { createSignal, lazy, onCleanup, onMount } from "solid-js";
import { Toaster, toast } from "solid-toast";

import APIKeyModal from "@/components/api-key-modal";
import { database } from "@/lib/database";
import { hasDuplicateHunt } from "@/lib/hunt-dedup";
import { detectHuntReportType } from "@/lib/hunt-detector";
import { validateHuntPartyReport } from "@/lib/hunt-party";
import { getPartyHuntFingerprint } from "@/lib/hunt-party-fingerprint";
import {
	createPartyHuntDeleteMutation,
	createPartyHuntUpsertMutation,
	hasStoredSyncAPIKey,
	saveSyncAPIKey,
	startPartyHuntSync,
	synchronizePartyHunts,
} from "@/lib/hunt-sync";
import * as toastStyles from "@/styles/toast.css";
import type { HuntRecord, View } from "@/types/hunt-common";
import type { ParsedHuntParty } from "@/types/hunt-party";

const AppShell = lazy(() => import("@/components/app-shell"));
const HuntImporter = lazy(() => import("@/components/hunt-importer"));
const HuntDashboard = lazy(() => import("@/components/hunt-dashboard"));
const HuntViewer = lazy(() => import("@/components/hunt-viewer"));
const StorageErrorModal = lazy(() => import("@/components/error-modal"));
const lastViewStorageKey = "hunt-vault:last-view";

const ensurePartyHuntFingerprints = async (records: HuntRecord[]) => {
	return Promise.all(
		records.map(async (record) => {
			if (detectHuntReportType(record.rawText) !== "party") {
				return null;
			}

			const validation = validateHuntPartyReport(record.rawText);
			if (validation.errors.length > 0) {
				return null;
			}
			if (record.fingerprint) {
				return record;
			}

			const fingerprint = await getPartyHuntFingerprint(validation.parsed);
			await database.hunts.update(record.id, { fingerprint });
			return { ...record, fingerprint };
		}),
	).then((partyRecords) => partyRecords.filter((record): record is HuntRecord => record !== null));
};

const getStoredView = (): View => {
	try {
		const storedView = localStorage.getItem(lastViewStorageKey);
		return storedView === "party" || storedView === "import" ? storedView : "party";
	} catch {
		return "party";
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
	const [apiKeyModalOpen, setAPIKeyModalOpen] = createSignal(false);
	const [apiKeyPromptDismissed, setAPIKeyPromptDismissed] = createSignal(false);
	const clickSound = new Audio("/click.mp3");

	const checkDatabaseAccess = async () => {
		try {
			if (typeof indexedDB === "undefined") {
				throw new Error("IndexedDB não está disponível neste navegador.");
			}

			await database.open();
			await database.hunts.count();
			return true;
		} catch {
			setStorageError(true);
			return false;
		}
	};

	onMount(() => {
		let disposed = false;
		let stopSync: () => void = () => undefined;
		void checkDatabaseAccess().then((available) => {
			if (available && !disposed) {
				stopSync = startPartyHuntSync(() => {
					void loadHistory();
				});
			}
		});
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
			disposed = true;
			stopSync();
			document.removeEventListener("click", handleButtonClick);
			clickSound.pause();
			clickSound.currentTime = 0;
		});
	});

	const loadHistory = async () => {
		setLoadingHistory(true);

		try {
			const storedRecords = await database.hunts.orderBy("createdAt").reverse().toArray();
			const records = await ensurePartyHuntFingerprints(storedRecords);
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

		if (nextView === "party") {
			void loadHistory();
		}
	};

	const readClipboardContent = async () => {
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
				if (!hasStoredSyncAPIKey() && !apiKeyPromptDismissed()) {
					setAPIKeyModalOpen(true);
				}
				toast.success(
					`Party Hunt reconhecido: ${validation.parsed.members.length} membros e ${validation.parsed.metrics.length} métricas gerais.`,
				);
				return;
			}

			setClipboardText("");
			toast.error("O relatório não é uma Party Hunt válida.");
		} catch {
			toast.error("Não foi possível acessar o clipboard. Autorize o acesso e tente novamente.");
		} finally {
			setReadingClipboard(false);
		}
	};

	const readClipboard = () => {
		void readClipboardContent();
	};

	const submitAPIKey = (apiKey: string) => {
		if (!saveSyncAPIKey(apiKey)) {
			return false;
		}
		setAPIKeyModalOpen(false);
		return true;
	};

	const dismissAPIKeyPrompt = () => {
		setAPIKeyPromptDismissed(true);
		setAPIKeyModalOpen(false);
	};

	const saveHunt = async () => {
		const rawText = clipboardText();
		if (!rawText.trim()) return;

		setSaving(true);

		try {
			const reportType = detectHuntReportType(rawText);
			if (reportType !== "party") {
				toast.error("Somente relatórios de Party Hunt podem ser salvos.");
				return;
			}
			const validation = validateHuntPartyReport(rawText);
			if (validation.errors.length > 0) {
				toast.error(`Não foi possível validar a Party Hunt: ${validation.errors[0]}.`);
				return;
			}
			const parsedParty: ParsedHuntParty = validation.parsed;
			const fingerprint = await getPartyHuntFingerprint(parsedParty);

			const existingHunts = await database.hunts.toArray();
			if (hasDuplicateHunt(existingHunts, rawText, fingerprint)) {
				toast.error("Esta caçada já foi importada anteriormente.");
				return;
			}

			const record: HuntRecord = {
				id: fingerprint,
				createdAt: new Date().toISOString(),
				rawText,
				fingerprint,
			};

			await database.transaction("rw", database.hunts, database.syncOutbox, async () => {
				await database.hunts.add(record);
				await database.syncOutbox.put(createPartyHuntUpsertMutation(record, parsedParty));
			});
			setHistory((records) => [record, ...records]);
			setClipboardText("");
			toast.success("Resultado salvo no IndexedDB!");
			void synchronizePartyHunts().catch(() => undefined);
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
			const record = records[deletedIndex];
			let fingerprint = record.fingerprint;
			if (!fingerprint) {
				const validation = validateHuntPartyReport(record.rawText);
				if (validation.errors.length === 0) {
					fingerprint = await getPartyHuntFingerprint(validation.parsed);
				}
			}

			await database.transaction("rw", database.hunts, database.syncOutbox, async () => {
				if (fingerprint) {
					await database.syncOutbox.put(createPartyHuntDeleteMutation(fingerprint));
				}
				await database.hunts.delete(id);
			});

			const deletedRecord = await database.hunts.get(id);
			if (deletedRecord) {
				throw new Error("O registro ainda existe no IndexedDB.");
			}

			const remainingRecords = records.filter((record) => record.id !== id);
			setHistory(remainingRecords);
			toast.success("Caçada excluída do histórico.");
			void synchronizePartyHunts().catch(() => undefined);
		} catch {
			toast.error("Não foi possível excluir a caçada.");
		} finally {
			setDeleting(false);
		}
	};

	return (
		<>
			<Toaster
				position="bottom-right"
				gutter={10}
				toastOptions={{ className: toastStyles.toast, style: toastStyles.toastInlineStyle }}
			/>
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
						<HuntDashboard history={history()} />
						<HuntViewer
							history={history()}
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
			<APIKeyModal open={apiKeyModalOpen()} onSubmit={submitAPIKey} onCancel={dismissAPIKeyPrompt} />
		</>
	);
};
