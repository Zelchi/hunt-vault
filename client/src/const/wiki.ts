export const TIBIA_WIKI_API = "https://www.tibiawiki.com.br/api.php";
export const TIBIA_WIKI_ORIGIN = "https://www.tibiawiki.com.br";

export const WIKI_CATALOG_CATEGORIES = {
	monsters: { title: "Categoria:Criaturas", kind: "monster" },
	spells: { title: "Categoria:Magias Instantâneas", kind: "spell" },
	runes: { title: "Categoria:Runas", kind: "rune" },
	imbuements: { title: "Categoria:Imbuements", kind: "imbuement" },
} as const;

export const WIKI_CATALOG_REQUESTS = [
	{ key: "monsters" as const, ...WIKI_CATALOG_CATEGORIES.monsters },
	{ key: "spells" as const, ...WIKI_CATALOG_CATEGORIES.spells },
	{ key: "runes" as const, ...WIKI_CATALOG_CATEGORIES.runes },
	{ key: "imbuements" as const, ...WIKI_CATALOG_CATEGORIES.imbuements },
];

export const WIKI_CATALOG_CACHE_KEY = "hunt-vault:wiki-entity-catalog:v1";
export const WIKI_SEARCH_CACHE_KEY = "hunt-vault:wiki-search-results:v1";
export const WIKI_CATALOG_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
export const WIKI_SEARCH_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;

export const IMBUEMENT_LEVEL_3_IMAGES: Record<string, string> = {
	bash: "Imbuement_Skillboost_Club3.png",
	blockade: "Imbuement_Skillboost_Shielding3.png",
	chop: "Imbuement_Skillboost_Axe3.png",
	"cloud fabric": "Imbuement_Protection_Energy3.png",
	"demon presence": "Imbuement_Protection_Holy3.png",
	"dragon hide": "Imbuement_Protection_Fire3.png",
	electrify: "Imbuement_Damage_Energy3.png",
	epiphany: "Imbuement_Skillboost_Magic3.png",
	featherweight: "Imbuement_Featherweight3.png",
	frost: "Imbuement_Damage_Ice3.png",
	"lich shroud": "Imbuement_Protection_Death3.png",
	precision: "Imbuement_Skillboost_Distance3.png",
	punch: "Imbuement_Skillboost_Fist3.png",
	"quara scale": "Imbuement_Protection_Ice3.png",
	reap: "Imbuement_Damage_Death3.png",
	scorch: "Imbuement_Damage_Fire3.png",
	slash: "Imbuement_Skillboost_Sword3.png",
	"snake skin": "Imbuement_Protection_Earth3.png",
	strike: "Imbuement_Critical-Strike3.png",
	swiftness: "Imbuement_Skillboost_Speed3.png",
	vampirism: "Imbuement_Life_Leech3.png",
	venom: "Imbuement_Damage_Earth3.png",
	vibrancy: "Imbuement_Vibrancy3.png",
	void: "Imbuement_Mana_Leech3.png",
};
