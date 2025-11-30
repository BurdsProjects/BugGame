// NOTE: Just putting all my “customizable stuff” up here so I don’t lose it again…
const ROCK_IMAGE = 'Pictures/rock.jpg'; // I *think* this is the right one? Might replace later.

// Ok, mapping rarities to images—left some empty because I still haven't decided on them lol
const BUG_IMAGES_BY_RARITY = {
    common: '',
    uncommon: '',
    rare: '',
    epic: '',
    legendary: ''
};

// These are the little icons for the collection page—honestly not sure if all of them are needed
const BUG_THUMBNAILS_BY_RARITY = {
    common: 'common.jpg',
    uncommon: '',
    rare: '',
    epic: '',
    legendary: ''
};

// List of bugs (might add more when I'm less tired)
const bugTypes = [
    { 
        emoji: '🐜',
        name: 'Ant',
        baseChance: 30,   // arbitrary-ish
        description: 'Hard-working insects known for colonies and all that.',
        habitat: 'Mostly dirt stuff.',
        diet: 'Random seeds, bugs, sugary goo',
        images: {
            common: 'Pictures/ant_common.jpg',
            uncommon: 'Pictures/ant_uncommon.jpg',
            rare: 'Pictures/ant_rare.jpg',
            epic: 'Pictures/ant_epic.jpg',
            legendary: 'Pictures/ant_legendary.jpg'
        }
    },
    { 
        emoji: '🐞',
        name: 'Ladybug',
        baseChance: 30,
        description: 'Red and lucky. My grandma loved these.',
        habitat: 'Gardens etc.',
        diet: 'Aphids—kind of gross.',
        images: {
            common: 'Pictures/ladybug_common.jpg',
            uncommon: 'Pictures/ladybug_uncommon.jpg',
            rare: 'Pictures/ladybug_rare.jpg',
            epic: 'Pictures/ladybug_epic.jpg',
            legendary: 'Pictures/ladybug_legendary.jpg'
        }
    }
];

// Rarity odds… might tweak these later if it feels too stingy
const rarityChances = [
    { rarity: 'common', chance: 50 },
    { rarity: 'uncommon', chance: 25 },
    { rarity: 'rare', chance: 15 },
    { rarity: 'epic', chance: 10 },
    { rarity: 'legendary', chance: 5 }
];

let totalFlips = 0;         // keeping track just because it's fun
let foundBugs = new Set();  // NOTE: Set so we don’t duplicate
let isFlipping = false;     // prevents rock spam

// grabbing DOM stuff — bit tedious but whatever
const rock = document.getElementById('rock');
const bugDisplay = document.getElementById('bugDisplay');
const bugInfo = document.getElementById('bugInfo');
const flipButton = document.getElementById('flipButton');
const totalFlipsEl = document.getElementById('totalFlips');
const uniqueBugsEl = document.getElementById('uniqueBugs');
const rockImage = document.getElementById('rockImage');
const bugImage = document.getElementById('bugImage');
const gameTab = document.getElementById('gameTab');
const collectionTab = document.getElementById('collectionTab');
const gameContent = document.getElementById('gameContent');
const collectionContent = document.getElementById('collectionContent');
const collectionGrid = document.getElementById('collectionGrid');

const bugModal = document.getElementById('bugModal');
const modalClose = document.getElementById('modalClose');
const modalBody = document.getElementById('modalBody');

// set up the rock display (I always forget this part)
if (ROCK_IMAGE) {
    rockImage.src = ROCK_IMAGE;
    rockImage.classList.add('active');
}

// modal stuff—this part always annoys me but it works
modalClose.addEventListener('click', () => {
    bugModal.classList.add('hidden');
});
bugModal.addEventListener('click', (e) => {
    if (e.target === bugModal) {
        bugModal.classList.add('hidden');
    }
});

// rebuilds the whole collection view (probably not the most efficient)
function initializeCollection() {
    collectionGrid.innerHTML = ''; // wipe it clean

    rarityChances.forEach(rarityObj => {
        const section = document.createElement('div');
        section.className = 'rarity-section';

        const header = document.createElement('div');
        header.className = `rarity-section-header ${rarityObj.rarity}-header`;

        // quick count of how many bugs we got of this rarity
        let foundCount = 0;
        bugTypes.forEach(bug => {
            if (foundBugs.has(`${bug.name}-${rarityObj.rarity}`)) {
                foundCount++;
            }
        });

        header.textContent = `${rarityObj.rarity.toUpperCase()} (${foundCount}/${bugTypes.length})`;
        section.appendChild(header);

        const grid = document.createElement('div');
        grid.className = 'rarity-bugs-grid';

        bugTypes.forEach(bug => {
            const key = `${bug.name}-${rarityObj.rarity}`;
            const unlocked = foundBugs.has(key);

            const item = document.createElement('div');
            item.className = `collection-item ${unlocked ? 'found' : 'locked'}`;

            // thumbnail stuff—probably overcomplicated but I’m leaving it
            const thumb =
                (bug.thumbnails && bug.thumbnails[rarityObj.rarity]) ||
                (bug.images && bug.images[rarityObj.rarity]) ||
                BUG_THUMBNAILS_BY_RARITY[rarityObj.rarity] ||
                BUG_IMAGES_BY_RARITY[rarityObj.rarity];

            item.innerHTML = `
                <div class="collection-bug-display">
                    ${unlocked ? (thumb ? `<img src="${thumb}" style="max-width:48px;max-height:48px;">` : bug.emoji) : '❓'}
                </div>
                <div class="collection-bug-name">${unlocked ? bug.name : '???'}</div>
                ${unlocked ? '' : '<div class="collection-locked">Not found yet</div>'}
            `;

            // modal popup for both locked and unlocked
            item.style.cursor = 'pointer';
            item.addEventListener('click', () => {
                if (unlocked) {
                    // Show full details for found bugs
                    const img =
                        (bug.images && bug.images[rarityObj.rarity]) ||
                        BUG_IMAGES_BY_RARITY[rarityObj.rarity] ||
                        '';

                    modalBody.innerHTML = `
                        <div class="modal-bug-image">
                            ${img ? `<img src="${img}">` : bug.emoji}
                        </div>
                        <div class="modal-bug-name">${bug.name}</div>
                        <div class="modal-bug-rarity rarity-${rarityObj.rarity}">
                            ${rarityObj.rarity.toUpperCase()}
                        </div>
                        <div class="modal-bug-info">
                            <p><strong>Description:</strong> ${bug.description}</p>
                            <p><strong>Habitat:</strong> ${bug.habitat}</p>
                            <p><strong>Diet:</strong> ${bug.diet}</p>
                            <p><strong>Base Chance:</strong> ${bug.baseChance}%</p>
                            <p><strong>Status:</strong> ✓ Collected</p>
                        </div>
                    `;
                } else {
                    // Show "find me first" message for unfound bugs
                    modalBody.innerHTML = `
                        <div class="modal-bug-image" style="font-size: 80px; margin-bottom: 30px;">
                            ❓
                        </div>
                        <div class="modal-bug-name">Mystery Bug</div>
                        <div class="modal-bug-rarity rarity-${rarityObj.rarity}">
                            ${rarityObj.rarity.toUpperCase()}
                        </div>
                        <div class="modal-bug-info">
                            <p style="font-size: 16px; text-align: center; color: #666;">
                                Find this bug first to see its details!
                            </p>
                        </div>
                    `;
                }
                bugModal.classList.remove('hidden');
            });

            grid.appendChild(item);
        });

        section.appendChild(grid);
        collectionGrid.appendChild(section);
    });
}

// tabs (not much to say here)
gameTab.addEventListener('click', () => {
    gameTab.classList.add('active');
    collectionTab.classList.remove('active');
    gameContent.classList.remove('hidden');
    collectionContent.classList.add('hidden');
});
collectionTab.addEventListener('click', () => {
    collectionTab.classList.add('active');
    gameTab.classList.remove('active');
    collectionContent.classList.remove('hidden');
    gameContent.classList.add('hidden');
    initializeCollection(); // update it when switching
});

// run it once so the page isn’t blank
initializeCollection();

// minor helper — picks rarity
function getRandomRarity() {
    let total = 0;
    rarityChances.forEach(x => total += x.chance);

    let roll = Math.random() * total;

    for (let r of rarityChances) {
        roll -= r.chance;
        if (roll <= 0) return r.rarity;
    }

    return 'common'; // fallback if something weird happens
}

// picks a bug at random
function getRandomBug() {
    let total = 0;
    bugTypes.forEach(b => total += b.baseChance);

    let roll = Math.random() * total;

    for (let b of bugTypes) {
        roll -= b.baseChance;
        if (roll <= 0) {
            const rarity = getRandomRarity();
            const img = b.images?.[rarity] || BUG_IMAGES_BY_RARITY[rarity] || '';
            return { ...b, rarity, image: img };
        }
    }

    // emergency fallback
    return { ...bugTypes[0], rarity: 'common', image: bugTypes[0].images.common };
}

// the main flip handler
function flipRock() {
    if (isFlipping) return; // don't double flip
    isFlipping = true;
    flipButton.disabled = true;

    // Play sound effect
    const clickSound = document.getElementById('clickSound');
    if (clickSound) {
        clickSound.currentTime = 0; // Reset to start
        clickSound.play().catch(err => console.log('Sound play failed:', err));
    }

    rock.classList.add('flipping');
    bugDisplay.classList.remove('show');

    // delay just to make the animation feel right
    setTimeout(() => {
        const bug = getRandomBug();
        totalFlips++;
        foundBugs.add(`${bug.name}-${bug.rarity}`);

        if (bug.image) {
            bugImage.src = bug.image;
            bugImage.classList.add('active');
            bugDisplay.innerHTML = '';
            bugDisplay.appendChild(bugImage);
        } else {
            bugImage.classList.remove('active');
            bugDisplay.textContent = bug.emoji;
        }

        bugDisplay.classList.add('show');

        let rarityMessage = {
            legendary: "Wow! Legendary find!",
            epic: "Huge! Epic!",
            rare: "Nice! Rare catch!",
            uncommon: "Neat, uncommon bug.",
            common: "Just a regular ole common one."
        }[bug.rarity];

        bugInfo.innerHTML = `
            <div class="bug-name">${bug.name}</div>
            <div class="bug-rarity rarity-${bug.rarity}">${bug.rarity.toUpperCase()}</div>
            <p style="color:rgb(198, 207, 148);margin-top:10px;">${rarityMessage}</p>
        `;

        totalFlipsEl.textContent = totalFlips;
        uniqueBugsEl.textContent = foundBugs.size;

        if (!collectionContent.classList.contains('hidden')) {
            initializeCollection();
        }
    }, 400);

    setTimeout(() => {
        rock.classList.remove('flipping');
        rock.style.opacity = '1';
        rock.style.transform = 'translateX(-50%)';
        isFlipping = false;
        flipButton.disabled = false;
    }, 800);
}

rock.addEventListener('click', flipRock);
flipButton.addEventListener('click', flipRock);