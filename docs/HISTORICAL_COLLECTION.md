# Historical visual collection

Scholar profiles render locally stored book or manuscript images in the **Visual archive** section. Each image includes a caption, a source and rights link, and an explicit note where it is a later copy, translation, or contextual artifact. The profile gallery does not use portraits or Dargah photographs. The existing Dargah photograph remains separate from the archive.

## Directly related records

- Ahmad Raza Khan: the scanned printed title page of *Radd-ur-Rafaza*, Bareilly, 1902. Source scan credited to Rekhta; Commons records public-domain status in India. This is a printed title page, not an autograph. *Kashf al-Illah* scans are not included because redistribution rights for available modern scans are unclear.
- Al-Khwarizmi: Friedrich Rosen’s 1831 edition and translation of *The Algebra of Mohammed Ben Musa*, downloaded from Internet Archive. It is not a medieval manuscript.
- Banu Musa: an illustrated device in a 1210 copy of the *Book of Ingenious Devices*, from the Staatsbibliothek zu Berlin. The work is attributed to the brothers collectively; this image is not assigned to an individual brother.
- Al-Battani: a lunar-phase diagram in Carlo Alfonso Nallino’s 1899 edition of *Opus astronomicum*.
- Al-Biruni: lunar-phase illustration in an 18th-century copy of *Kitab al-Tafhim* held by Iran Parliament Library.
- Ibn Sina: an illuminated early-15th-century copy of the *Canon of Medicine* from the U.S. National Library of Medicine.
- Al-Zahrawi: surgical instrument illustration in a 15th-century copy of *Kitab al-Tasrif*.
- Al-Razi: an illuminated Latin translation of *Kitab al-Hawi*, BNF manuscript Latin 6912.
- Ibn al-Haytham: a 13th-century optics and astronomy manuscript containing works by Hypsicles and Ibn al-Haytham.
- Jabir ibn Hayyan: title page of the 1686 English edition *The Works of Geber*. This is an early modern edition with a historically complex attribution, not a medieval Arabic manuscript.

## Context images on related profiles

Al-Farghani’s profile uses al-Battani’s later astronomy edition as an explicitly labeled astronomy-context image. Abu al-Wafa’s profile uses the al-Khwarizmi algebra edition as a mathematics-context image. Al-Kindi’s profile uses the al-Biruni astronomy manuscript as a context image. Ibn al-Nafis’s profile uses a later *Canon of Medicine* copy as medical-text context. Hunayn ibn Ishaq’s profile uses al-Razi’s medical text as context. Thabit ibn Qurra’s profile uses the optics manuscript containing Ibn al-Haytham’s work as context. The three individual Banu Musa profiles use their collective mechanical-work image and explicitly say it cannot be assigned to one brother.

These reuse decisions keep a real historical image visible on each current profile without misattributing another scholar’s work. Every image is copied into `public/images/scholars/` and served locally, rather than depending on a live third-party image host. The source catalog is in `content/historical-collection.json`; profile rendering is in `src/data/historical-collection.ts`.

## Homepage museum objects and motion

The homepage still uses its animated green and gold CSS background (`.museum-hero:before` / `:after`, `greenGlow`, and `patternDrift`). The local Met Open Access Rasulid astrolabe (91.1.535a–h) and Blue Qur’an folio (2004.88) remain as foreground museum objects. They are not used as scholar portraits or profile substitutes.

## Rights notes

Rights statements follow the linked institutional or Wikimedia Commons record and can differ by territory. Review the linked record before redistributing the full project outside its stated jurisdiction. The Thabit/Ibn al-Haytham manuscript photograph is licensed CC BY-SA 4.0 and is attributed to Peyrasbrc in the profile caption.
