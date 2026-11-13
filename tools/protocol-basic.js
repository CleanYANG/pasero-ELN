/* Basic protocols organised by Pasero (the same templates that ship with the Pasero app). Generic templates: adjust to your kit and lab SOPs. */
window.PaseroBasicProtocols = [
{
"id": "1x-pbs-ph-7-4-1-l",
"title": "1x PBS, pH 7.4, 1 L",
"cat": "recipes",
"tags": [
"buffer"
],
"summary": "General wash buffer for cells, tissues, and immunoassays.",
"steps": "1. Add ~800 mL distilled water to a clean bottle.\n2. Add NaCl, KCl, Na2HPO4, and KH2PO4.\n3. Stir until fully dissolved.\n4. Adjust pH to 7.4.\n5. Bring volume to 1 L with distilled water.\n6. Sterilize by autoclaving or filtration if required.\n7. Store at room temperature or 4°C.",
"vars": "Reagents:\n- NaCl: 8.0 g\n- KCl: 0.2 g\n- Na2HPO4: 1.44 g\n- KH2PO4: 0.24 g\n- Distilled water: to 1 L\n- HCl or NaOH: for pH adjustment",
"notes": "- For cell culture use, prepare sterile PBS.\n- Do not add calcium or magnesium unless specifically required."
},
{
"id": "10x-pbs-ph-7-4-1-l",
"title": "10x PBS, pH 7.4, 1 L",
"cat": "recipes",
"tags": [
"buffer"
],
"summary": "Stock solution for preparing 1x PBS.",
"steps": "1. Dissolve all salts in ~800 mL distilled water.\n2. Adjust pH to 7.4.\n3. Bring volume to 1 L.\n4. Sterilize if needed.\n5. Dilute 1:10 with distilled water to prepare 1x PBS.",
"vars": "Reagents:\n- NaCl: 80 g\n- KCl: 2 g\n- Na2HPO4: 14.4 g\n- KH2PO4: 2.4 g\n- Distilled water: to 1 L",
"notes": ""
},
{
"id": "50x-tae-buffer-1-l",
"title": "50x TAE Buffer, 1 L",
"cat": "recipes",
"tags": [
"buffer",
"gel"
],
"summary": "Stock electrophoresis buffer for agarose gel electrophoresis.",
"steps": "1. Add Tris base to ~700 mL distilled water.\n2. Add glacial acetic acid carefully.\n3. Add 0.5 M EDTA, pH 8.0.\n4. Mix until fully dissolved.\n5. Bring volume to 1 L.\n6. Store at room temperature.\n7. Dilute to 1x before use.",
"vars": "Reagents:\n- Tris base: 242 g\n- Glacial acetic acid: 57.1 mL\n- 0.5 M EDTA, pH 8.0: 100 mL\n- Distilled water: to 1 L",
"notes": "- For 1x TAE, dilute 20 mL 50x TAE into 980 mL water."
},
{
"id": "10x-tbe-buffer-1-l",
"title": "10x TBE Buffer, 1 L",
"cat": "recipes",
"tags": [
"buffer",
"gel"
],
"summary": "Electrophoresis buffer for DNA gels with better buffering capacity than TAE.",
"steps": "1. Dissolve Tris base and boric acid in ~800 mL water.\n2. Add EDTA.\n3. Bring volume to 1 L.\n4. Store at room temperature.\n5. Dilute to 1x before use.",
"vars": "Reagents:\n- Tris base: 108 g\n- Boric acid: 55 g\n- 0.5 M EDTA, pH 8.0: 40 mL\n- Distilled water: to 1 L",
"notes": ""
},
{
"id": "te-buffer-ph-8-0-100-ml",
"title": "TE Buffer, pH 8.0, 100 mL",
"cat": "recipes",
"tags": [
"buffer"
],
"summary": "Storage buffer for DNA.",
"steps": "1. Add Tris-HCl and EDTA to ~80 mL nuclease-free water.\n2. Mix well.\n3. Bring volume to 100 mL.\n4. Store at room temperature or 4°C.",
"vars": "Reagents:\n- 1 M Tris-HCl, pH 8.0: 1 mL\n- 0.5 M EDTA, pH 8.0: 0.2 mL\n- Nuclease-free water: to 100 mL\n\nFinal concentration:\n- 10 mM Tris-HCl\n- 1 mM EDTA",
"notes": ""
},
{
"id": "3-m-sodium-acetate-ph-5-2-100-ml",
"title": "3 M Sodium Acetate, pH 5.2, 100 mL",
"cat": "recipes",
"tags": [
"buffer",
"precip"
],
"summary": "DNA/RNA precipitation.",
"steps": "1. Dissolve sodium acetate trihydrate in ~70 mL nuclease-free water.\n2. Adjust pH to 5.2 with glacial acetic acid.\n3. Bring volume to 100 mL.\n4. Sterilize by filtration.\n5. Store at room temperature.",
"vars": "Reagents:\n- Sodium acetate trihydrate: 40.8 g\n- Nuclease-free water: to 100 mL\n- Glacial acetic acid: for pH adjustment",
"notes": ""
},
{
"id": "70-ethanol-100-ml",
"title": "70% Ethanol, 100 mL",
"cat": "recipes",
"tags": [
"buffer",
"precip"
],
"summary": "DNA/RNA wash, surface disinfection, and sample processing.",
"steps": "1. Mix ethanol and water thoroughly.\n2. Label with concentration and preparation date.\n3. Store tightly capped.",
"vars": "Reagents:\n- Absolute ethanol: 70 mL\n- Distilled or nuclease-free water: 30 mL",
"notes": "- Use nuclease-free water when preparing ethanol for nucleic acid work."
},
{
"id": "lb-broth-1-l",
"title": "LB Broth, 1 L",
"cat": "recipes",
"tags": [
"buffer",
"transform"
],
"summary": "Bacterial culture medium.",
"steps": "1. Dissolve tryptone, yeast extract, and NaCl in ~900 mL water.\n2. Bring volume to 1 L.\n3. Autoclave.\n4. Cool before adding antibiotics if needed.",
"vars": "Reagents:\n- Tryptone: 10 g\n- Yeast extract: 5 g\n- NaCl: 10 g\n- Distilled water: to 1 L",
"notes": "- Add antibiotics only after medium cools to approximately 50–60°C."
},
{
"id": "lb-agar-1-l",
"title": "LB Agar, 1 L",
"cat": "recipes",
"tags": [
"buffer",
"transform"
],
"summary": "Bacterial agar plates.",
"steps": "1. Dissolve all components in water.\n2. Autoclave.\n3. Cool to ~50–60°C.\n4. Add antibiotic if required.\n5. Pour plates under sterile conditions.\n6. Store plates at 4°C.",
"vars": "Reagents:\n- Tryptone: 10 g\n- Yeast extract: 5 g\n- NaCl: 10 g\n- Agar: 15 g\n- Distilled water: to 1 L",
"notes": ""
},
{
"id": "1-agarose-gel-50-ml",
"title": "1% Agarose Gel, 50 mL",
"cat": "recipes",
"tags": [
"gel"
],
"summary": "DNA electrophoresis.",
"steps": "1. Add agarose to electrophoresis buffer.\n2. Heat until agarose is fully dissolved.\n3. Cool to ~55–60°C.\n4. Add DNA stain if used in-gel.\n5. Pour into gel tray with comb.\n6. Allow gel to solidify.\n7. Run with matching 1x electrophoresis buffer.",
"vars": "Reagents:\n- Agarose: 0.5 g\n- 1x TAE or 1x TBE: 50 mL\n- DNA stain: according to supplier instructions",
"notes": ""
},
{
"id": "ripa-lysis-buffer-100-ml",
"title": "RIPA Lysis Buffer, 100 mL",
"cat": "recipes",
"tags": [
"buffer",
"protein"
],
"summary": "Whole-cell protein extraction.",
"steps": "1. Dissolve components in water.\n2. Adjust pH if necessary.\n3. Bring volume to 100 mL.\n4. Store at 4°C.\n5. Add inhibitors immediately before use.",
"vars": "Reagents:\n- 1 M Tris-HCl, pH 7.4 or 7.5: 5 mL\n- 5 M NaCl: 3 mL\n- NP-40 or Triton X-100: 1 mL\n- Sodium deoxycholate: 0.5 g\n- 10% SDS: 1 mL\n- EDTA, optional, 0.5 M: 0.2 mL\n- Distilled water: to 100 mL\n- Protease/phosphatase inhibitors: add fresh before use\n\nFinal concentration:\n- 50 mM Tris-HCl\n- 150 mM NaCl\n- 1% NP-40 or Triton X-100\n- 0.5% sodium deoxycholate\n- 0.1% SDS\n- 1 mM EDTA, optional",
"notes": ""
},
{
"id": "5x-sds-page-sample-buffer-10-ml",
"title": "5x SDS-PAGE Sample Buffer, 10 mL",
"cat": "recipes",
"tags": [
"buffer",
"sdspage",
"wb"
],
"summary": "Protein sample loading for SDS-PAGE.",
"steps": "1. Mix Tris-HCl, SDS, glycerol, and bromophenol blue.\n2. Bring volume to 10 mL.\n3. Aliquot and store at -20°C.\n4. Add reducing agent freshly if not included.",
"vars": "Reagents:\n- 1 M Tris-HCl, pH 6.8: 3.125 mL\n- SDS: 1.0 g\n- Glycerol: 5 mL\n- Bromophenol blue: 5–10 mg\n- Distilled water: to 10 mL\n- Reducing agent: add DTT or beta-mercaptoethanol fresh before use\n\nTypical final in 1x:\n- 62.5 mM Tris-HCl, pH 6.8\n- 2% SDS\n- 10% glycerol\n- tracking dye\n- reducing agent if required",
"notes": ""
},
{
"id": "tbst-1-l",
"title": "TBST, 1 L",
"cat": "recipes",
"tags": [
"buffer",
"wb"
],
"summary": "Western blot washing buffer.",
"steps": "1. Add 10x TBS to ~800 mL water.\n2. Add Tween-20.\n3. Mix thoroughly.\n4. Bring volume to 1 L.",
"vars": "Reagents:\n- 10x TBS: 100 mL\n- Tween-20: 1 mL\n- Distilled water: to 1 L\n\nFinal concentration:\n- 1x TBS\n- 0.1% Tween-20",
"notes": ""
},
{
"id": "5-milk-blocking-buffer-in-tbst-100-ml",
"title": "5% Milk Blocking Buffer in TBST, 100 mL",
"cat": "recipes",
"tags": [
"buffer",
"wb"
],
"summary": "Western blot membrane blocking.",
"steps": "1. Add milk powder to TBST.\n2. Mix until fully suspended.\n3. Prepare fresh before use when possible.",
"vars": "Reagents:\n- Non-fat dry milk: 5 g\n- TBST: to 100 mL",
"notes": "- For phospho-specific antibodies, BSA blocking may be preferable."
},
{
"id": "5-bsa-blocking-buffer-in-tbst-100-ml",
"title": "5% BSA Blocking Buffer in TBST, 100 mL",
"cat": "recipes",
"tags": [
"buffer",
"wb"
],
"summary": "Western blot blocking for phospho-protein detection or milk-sensitive antibodies.",
"steps": "1. Add BSA to TBST.\n2. Mix until dissolved.\n3. Prepare fresh or store short term at 4°C.",
"vars": "Reagents:\n- BSA: 5 g\n- TBST: to 100 mL",
"notes": ""
},
{
"id": "genomic-dna-extraction-from-cultured-cells-spin-column-style",
"title": "Genomic DNA Extraction from Cultured Cells, Spin-Column Style",
"cat": "dna",
"tags": [
"gdna"
],
"summary": "Purify genomic DNA from cultured mammalian cells for PCR, genotyping, or qPCR.",
"steps": "1. Harvest cells and pellet by centrifugation.\n2. Remove supernatant and wash once with PBS.\n3. Add DNA lysis buffer and Proteinase K.\n4. Mix thoroughly and incubate until cells are fully lysed.\n5. Add ethanol or binding buffer according to the column chemistry.\n6. Transfer lysate to a DNA spin column.\n7. Centrifuge to bind DNA.\n8. Wash the column with the recommended wash buffers.\n9. Dry the membrane by an additional centrifugation step.\n10. Elute DNA with elution buffer or nuclease-free water.\n11. Measure DNA concentration and purity.\n12. Store DNA at 4°C for short term or -20°C for long term.",
"vars": "Input:\n- 1 x 10^5 to 5 x 10^6 cultured cells\n\nMaterials:\n- Cell pellet\n- PBS\n- Lysis buffer compatible with DNA purification\n- Proteinase K\n- Ethanol\n- DNA spin column and wash buffers\n- Elution buffer or nuclease-free water\n\nQuality Control:\n- A260/A280 is commonly used as a rough purity indicator.\n- Run an agarose gel if DNA integrity is important.",
"notes": "- Avoid vigorous vortexing if high molecular weight DNA is required.\n- Always follow the specific kit manual when using a commercial column kit."
},
{
"id": "crude-genomic-dna-extraction-for-pcr-screening",
"title": "Crude Genomic DNA Extraction for PCR Screening",
"cat": "dna",
"tags": [
"gdna",
"pcr"
],
"summary": "Rapid DNA preparation for colony PCR, genotyping PCR, or screening.",
"steps": "1. Place sample into a PCR tube or microcentrifuge tube.\n2. Add crude lysis buffer.\n3. Incubate at elevated temperature until lysed.\n4. Inactivate Proteinase K if used.\n5. Centrifuge briefly to pellet debris.\n6. Use a small volume of supernatant as PCR template.",
"vars": "Input:\n- Small cell pellet or small tissue fragment\n\nMaterials:\n- Alkaline or detergent-based crude lysis buffer\n- Proteinase K, optional\n- Heat block\n- Centrifuge",
"notes": "- Crude extracts are usually not suitable for long-term storage or sensitive downstream applications.\n- Use purified DNA when accurate quantification or sequencing is required."
},
{
"id": "plasmid-miniprep-alkaline-lysis-style",
"title": "Plasmid Miniprep, Alkaline Lysis Style",
"cat": "dna",
"tags": [
"miniprep"
],
"summary": "Purify plasmid DNA from E. coli culture.",
"steps": "1. Pellet bacterial culture by centrifugation.\n2. Remove supernatant completely.\n3. Resuspend pellet thoroughly in resuspension buffer.\n4. Add alkaline lysis buffer and mix gently by inversion.\n5. Do not vortex after lysis.\n6. Add neutralization buffer and mix immediately by inversion.\n7. Centrifuge to pellet cell debris and chromosomal DNA.\n8. Transfer cleared lysate to a plasmid spin column.\n9. Wash the column according to kit instructions.\n10. Dry the membrane.\n11. Elute plasmid DNA.\n12. Check DNA concentration and quality.\n13. Confirm plasmid by restriction digestion, PCR, or sequencing if needed.",
"vars": "Input:\n- 1–5 mL overnight bacterial culture\n\nMaterials:\n- Resuspension buffer\n- Alkaline lysis buffer\n- Neutralization buffer\n- Plasmid spin column or precipitation reagents\n- Wash buffer\n- Elution buffer or nuclease-free water",
"notes": "- Overgrown cultures may reduce plasmid quality.\n- Gentle mixing reduces genomic DNA contamination."
},
{
"id": "dna-ethanol-precipitation",
"title": "DNA Ethanol Precipitation",
"cat": "dna",
"tags": [
"precip"
],
"summary": "Concentrate DNA or remove salts from DNA solution.",
"steps": "1. Add 1/10 volume of 3 M sodium acetate to the DNA sample.\n2. Add 2–2.5 volumes of cold 100% ethanol.\n3. Mix and incubate at low temperature.\n4. Centrifuge to pellet DNA.\n5. Carefully remove supernatant.\n6. Wash pellet with 70% ethanol.\n7. Centrifuge again and remove ethanol.\n8. Air-dry the pellet briefly.\n9. Resuspend DNA in nuclease-free water or TE buffer.",
"vars": "Materials:\n- DNA sample\n- 3 M sodium acetate, pH 5.2\n- 100% ethanol\n- 70% ethanol\n- Nuclease-free water or TE buffer",
"notes": "- Do not over-dry the pellet, as this can make DNA difficult to dissolve.\n- Glycogen or carrier may help when precipitating very small amounts of DNA."
},
{
"id": "total-rna-extraction-from-cultured-cells-trizol-style",
"title": "Total RNA Extraction from Cultured Cells, TRIzol-Style",
"cat": "rna",
"tags": [
"rna"
],
"summary": "Extract total RNA from cultured cells using acid guanidinium thiocyanate-phenol-chloroform chemistry.",
"steps": "1. Lyse cells thoroughly in TRIzol or equivalent reagent.\n2. Incubate briefly at room temperature to allow complete dissociation of nucleoprotein complexes.\n3. Add chloroform.\n4. Shake vigorously and incubate briefly.\n5. Centrifuge to separate phases.\n6. Carefully transfer the upper aqueous phase to a new RNase-free tube.\n7. Add isopropanol to precipitate RNA.\n8. Incubate and centrifuge to pellet RNA.\n9. Wash RNA pellet with 75% ethanol.\n10. Air-dry the pellet briefly.\n11. Dissolve RNA in RNase-free water.\n12. Measure RNA concentration and purity.\n13. Store RNA at -80°C.",
"vars": "Input:\n- Cultured cells or cell pellet\n\nMaterials:\n- TRIzol or equivalent phenol/guanidinium reagent\n- Chloroform\n- Isopropanol\n- 75% ethanol prepared with RNase-free water\n- RNase-free water\n- RNase-free tubes and tips\n\nSafety:\n- Phenol/chloroform reagents are hazardous.\n- Work in a chemical fume hood and wear appropriate PPE.\n\nQuality Control:\n- A260/A280 and A260/A230 can indicate purity.\n- RNA integrity should be checked by gel, Bioanalyzer, TapeStation, or equivalent when needed.",
"notes": "- Avoid disturbing the interphase when collecting the aqueous phase.\n- Use RNase-free consumables.\n- Include DNase treatment if downstream applications are sensitive to genomic DNA contamination."
},
{
"id": "column-based-total-rna-extraction",
"title": "Column-Based Total RNA Extraction",
"cat": "rna",
"tags": [
"rna"
],
"summary": "Purify total RNA using silica membrane spin columns.",
"steps": "1. Lyse sample in RNA lysis buffer.\n2. Homogenize lysate if needed.\n3. Add ethanol to create RNA binding conditions.\n4. Transfer sample to RNA spin column.\n5. Centrifuge to bind RNA.\n6. Perform on-column DNase treatment if required.\n7. Wash the column.\n8. Dry the membrane by centrifugation.\n9. Elute RNA with RNase-free water.\n10. Measure RNA concentration and quality.\n11. Store RNA at -80°C.",
"vars": "Input:\n- Cultured cells or tissue lysate\n\nMaterials:\n- RNA lysis buffer\n- Ethanol\n- RNA spin column\n- Wash buffers\n- DNase treatment reagents, optional\n- RNase-free water",
"notes": "- Follow the specific column kit manual for sample amount and buffer volumes.\n- DNase treatment is recommended for qPCR when genomic DNA contamination may affect results."
},
{
"id": "rna-precipitation-and-cleanup",
"title": "RNA Precipitation and Cleanup",
"cat": "rna",
"tags": [
"rna",
"precip"
],
"summary": "Concentrate RNA or remove contaminants.",
"steps": "1. Add appropriate salt solution to RNA sample.\n2. Add alcohol for precipitation.\n3. Mix and incubate at low temperature.\n4. Centrifuge to pellet RNA.\n5. Wash pellet with 75% ethanol.\n6. Remove ethanol carefully.\n7. Air-dry briefly.\n8. Dissolve RNA in RNase-free water.",
"vars": "Materials:\n- RNA sample\n- Sodium acetate or ammonium acetate\n- Ethanol or isopropanol\n- 75% ethanol\n- RNase-free water",
"notes": "- RNA pellets can be difficult to see.\n- Avoid over-drying RNA pellets.\n- Use RNase-free reagents and tubes."
},
{
"id": "whole-cell-protein-extraction-using-ripa-buffer",
"title": "Whole-Cell Protein Extraction Using RIPA Buffer",
"cat": "protein",
"tags": [
"protein",
"wb"
],
"summary": "Extract total protein from cultured cells for western blot or protein assay.",
"steps": "1. Place cells and buffers on ice.\n2. Wash cells with ice-cold PBS.\n3. Add ice-cold RIPA buffer containing fresh inhibitors.\n4. Scrape cells and transfer lysate to a microcentrifuge tube.\n5. Incubate on ice with occasional mixing.\n6. Centrifuge at high speed at 4°C to pellet insoluble debris.\n7. Transfer supernatant to a new tube.\n8. Measure protein concentration.\n9. Mix with SDS sample buffer if preparing for SDS-PAGE.\n10. Store lysate at -80°C or proceed to analysis.",
"vars": "Input:\n- Cultured adherent or suspension cells\n\nMaterials:\n- Ice-cold PBS\n- Ice-cold RIPA buffer\n- Protease inhibitor cocktail\n- Phosphatase inhibitor cocktail, if studying phosphorylation\n- Cell scraper\n- Microcentrifuge\n- BCA or Bradford assay reagents\n\nQuality Control:\n- Keep samples cold to reduce protein degradation.\n- Use inhibitors freshly.\n- Avoid repeated freeze-thaw cycles.",
"notes": ""
},
{
"id": "protein-extraction-from-tissue-using-ripa-buffer",
"title": "Protein Extraction from Tissue Using RIPA Buffer",
"cat": "protein",
"tags": [
"protein",
"wb"
],
"summary": "Extract total protein from tissue samples.",
"steps": "1. Keep tissue frozen or on ice before lysis.\n2. Add ice-cold RIPA buffer to tissue.\n3. Homogenize thoroughly.\n4. Incubate lysate on ice.\n5. Centrifuge at 4°C to remove insoluble material.\n6. Transfer supernatant to a new tube.\n7. Measure protein concentration.\n8. Aliquot and store at -80°C.",
"vars": "Input:\n- Fresh or frozen tissue\n\nMaterials:\n- Ice-cold RIPA buffer with inhibitors\n- Homogenizer\n- Microcentrifuge\n- BCA or Bradford assay reagents",
"notes": "- Buffer volume depends on tissue amount and protein abundance.\n- Avoid overheating during homogenization."
},
{
"id": "nuclear-and-cytoplasmic-fractionation-basic-workflow",
"title": "Nuclear and Cytoplasmic Fractionation, Basic Workflow",
"cat": "protein",
"tags": [
"fraction",
"protein"
],
"summary": "Separate cytoplasmic and nuclear protein fractions.",
"steps": "1. Harvest cells and wash with cold PBS.\n2. Resuspend cell pellet in hypotonic buffer with inhibitors.\n3. Incubate on ice to swell cells.\n4. Add mild detergent and mix gently.\n5. Centrifuge to pellet nuclei.\n6. Collect supernatant as cytoplasmic fraction.\n7. Wash nuclear pellet if needed.\n8. Resuspend nuclear pellet in nuclear extraction buffer.\n9. Incubate with mixing to extract nuclear proteins.\n10. Centrifuge to remove insoluble debris.\n11. Collect supernatant as nuclear fraction.\n12. Validate fractionation by marker proteins if possible.",
"vars": "Materials:\n- Hypotonic cytoplasmic extraction buffer\n- Mild detergent\n- Nuclear extraction buffer with salt\n- Protease/phosphatase inhibitors\n- Centrifuge",
"notes": "- Lamin proteins can be used as nuclear markers.\n- Tubulin or GAPDH can be used as cytoplasmic markers.\n- Fractionation quality should be validated for critical experiments."
},
{
"id": "bca-protein-assay-general-workflow",
"title": "BCA Protein Assay, General Workflow",
"cat": "protein",
"tags": [
"bca"
],
"summary": "Determine protein concentration using a standard curve.",
"steps": "1. Prepare a dilution series of protein standards.\n2. Dilute samples to fall within the standard curve range.\n3. Add standards and samples to plate or tubes.\n4. Add BCA working reagent.\n5. Incubate according to reagent instructions.\n6. Measure absorbance at the recommended wavelength.\n7. Generate a standard curve.\n8. Calculate sample protein concentration.\n9. Apply dilution factor.",
"vars": "Materials:\n- Protein standards, such as BSA\n- BCA working reagent\n- Protein samples\n- Plate reader or spectrophotometer",
"notes": "- Use the same buffer background for standards when possible.\n- Detergents, reducing agents, and chelators may interfere depending on the assay chemistry."
},
{
"id": "bradford-protein-assay-general-workflow",
"title": "Bradford Protein Assay, General Workflow",
"cat": "protein",
"tags": [
"bca"
],
"summary": "Estimate protein concentration using Coomassie dye binding.",
"steps": "1. Prepare protein standards.\n2. Dilute samples if needed.\n3. Add standards and samples to plate or tubes.\n4. Add Bradford reagent.\n5. Incubate at room temperature.\n6. Measure absorbance at the recommended wavelength, commonly near 595 nm.\n7. Generate a standard curve.\n8. Calculate sample protein concentration.",
"vars": "Materials:\n- Protein standards, such as BSA\n- Bradford reagent\n- Protein samples\n- Plate reader or spectrophotometer",
"notes": "- Bradford assay is fast but sensitive to detergent compatibility.\n- Use standards prepared in a buffer similar to the sample buffer."
},
{
"id": "dna-quality-check",
"title": "DNA Quality Check",
"cat": "qc",
"tags": [
"quality"
],
"summary": "DNA Quality Check protocol template.",
"steps": "- Concentration by absorbance or fluorescence assay.\n- A260/A280 ratio as rough purity estimate.\n- A260/A230 ratio for organic/salt contamination.\n- Agarose gel for integrity and size.\n- PCR or restriction digestion for plasmid identity when required.",
"vars": "",
"notes": ""
},
{
"id": "rna-quality-check",
"title": "RNA Quality Check",
"cat": "qc",
"tags": [
"quality",
"rna"
],
"summary": "RNA Quality Check protocol template.",
"steps": "- Concentration by absorbance or fluorescence assay.\n- A260/A280 and A260/A230 ratios.\n- Integrity by gel electrophoresis or capillary electrophoresis.\n- DNase treatment confirmation when using qPCR.\n- Store RNA at -80°C.",
"vars": "",
"notes": ""
},
{
"id": "protein-lysate-quality-check",
"title": "Protein Lysate Quality Check",
"cat": "qc",
"tags": [
"quality",
"bca"
],
"summary": "Protein Lysate Quality Check protocol template.",
"steps": "- Protein concentration by BCA or Bradford assay.\n- Equal loading plan for western blot.\n- Avoid repeated freeze-thaw.\n- Include protease inhibitors.\n- Include phosphatase inhibitors for phosphorylation studies.\n- Confirm extraction/fractionation with marker proteins when needed.",
"vars": "",
"notes": ""
}
];
