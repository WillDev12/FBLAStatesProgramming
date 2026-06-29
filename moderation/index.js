// !! NOT MY WORK !!
// Artificially generated to communicate with the moderation api

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const readline = require("readline");
const requestAPI = require("./api/requestAPI.js");

const initialData = (async function () {
    try {
        const [usersRes, businessRes] = await Promise.all([
            requestAPI.get("/user/", { key: process.env.adminKey }),
            requestAPI.get("/data/", { key: process.env.adminKey }),
        ]);
        return { usersRes, businessRes };
    } catch (e) {
        console.error(e);
    }
})();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

readline.emitKeypressEvents(process.stdin);

function clearScreen() { console.clear(); }

function cleanupAndExit() {
    console.log("\n\nGoodbye!");
    rl.close();
    process.exit(0);
}

function showMainMenu(userData, businessData) {
    clearScreen();
    console.log("=== MAIN MENU ===");
    console.log("1. Users");
    console.log("2. Businesses");
    console.log("3. Comments");
    console.log("4. Exit");
    console.log("=================");

    rl.question("Choose an option (1-4): ", (answer) => {
        switch (answer.trim()) {
            case '1': showUsers(userData, businessData); break;
            case '2': showBusinesses(userData, businessData); break;
            case '3': showAllComments(userData, businessData); break;
            case '4': cleanupAndExit(); break;
            default:
                console.log("\nInvalid choice. Press Enter to try again.");
                rl.once('line', () => showMainMenu(userData, businessData));
        }
    });
}

// ─── Users ────────────────────────────────────────────────────────────────────

function showUsers(userData, businessData) {
    rl.resume();

    const chunksize = 4;
    let page = 0;
    let searchTerm = "";
    let usernames, parsedUsers;

    function getFiltered() {
        const all = Object.keys(userData);
        if (!searchTerm) return all;
        return all.filter(u => u.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    function rebuildPages() {
        usernames = getFiltered();
        parsedUsers = [];
        for (let i = 0; i < usernames.length; i += chunksize)
            parsedUsers.push(usernames.slice(i, i + chunksize));
        if (page >= parsedUsers.length) page = Math.max(0, parsedUsers.length - 1);
    }

    rebuildPages();

    function askUser() {
        clearScreen();

        if (usernames.length === 0) {
            console.log(searchTerm ? `No users matching "${searchTerm}".` : "No users.");
            rl.question("\nPress Enter to go back...", () => {
                searchTerm = "";
                page = 0;
                rebuildPages();
                askUser();
            });
            return;
        }

        const searchLabel = searchTerm ? ` [search: "${searchTerm}"]` : "";
        console.log(`=== Users (Page ${page + 1} of ${parsedUsers.length})${searchLabel} ===`);

        const currentPageItems = parsedUsers[page];
        for (let i = 0; i < currentPageItems.length; i++) {
            const u = currentPageItems[i];
            const tag = userData[u].verified ? " [verified]" : "";
            console.log(`  ${i + 1}. ${u}${tag}`);
        }

        console.log("-----------------");
        console.log("  [1-4] Select user   [s] Search   [c] Clear search");
        console.log("  [n] Next page       [p] Prev page    [q] Main menu");
        console.log("=================");

        rl.question("Enter your choice: ", (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'q') { showMainMenu(userData, businessData); return; }

            if (choice === 's') {
                rl.question("Search: ", (term) => {
                    searchTerm = term.trim();
                    page = 0;
                    rebuildPages();
                    askUser();
                });
                return;
            }

            if (choice === 'c') { searchTerm = ""; page = 0; rebuildPages(); askUser(); return; }
            if (choice === 'n') { if (page < parsedUsers.length - 1) page++; askUser(); return; }
            if (choice === 'p') { if (page > 0) page--; askUser(); return; }

            const num = parseInt(choice);
            if (!isNaN(num) && num >= 1 && num <= currentPageItems.length) {
                showUserProfile(currentPageItems[num - 1]);
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', askUser);
        });
    }

    function showUserProfile(username) {
        const u = userData[username];

        clearScreen();
        console.log("=== USER PROFILE ===");
        console.log(`Username: ${username}`);
        console.log(`UUID:     ${u.uuid}`);
        console.log(`Verified: ${u.verified ? "Yes" : "No"}`);
        console.log("====================");
        console.log("  [v] Toggle verify   [d] Delete   [b] Back");

        rl.question("Enter your choice: ", async (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'b') { askUser(); return; }

            if (choice === 'v') {
                const response = await requestAPI.patch(`/user/${username}/verify`, { key: process.env.adminKey });
                if (response.statusCode === 200) {
                    userData[username].verified = response.data.verified;
                    console.log(`\n"${username}" is now ${response.data.verified ? "verified" : "unverified"}.`);
                } else {
                    console.log("\nFailed to toggle verification:", response.data);
                }
                rl.question("\nPress Enter to continue...", () => showUserProfile(username));
                return;
            }

            if (choice === 'd') {
                const response = await requestAPI.delete(`/user/${username}`, { key: process.env.adminKey });
                if (response.statusCode === 200) {
                    delete userData[username];
                    console.log(`\nUser "${username}" deleted.`);
                } else {
                    console.log("\nFailed to delete user:", response.data);
                }
                rl.question("\nPress Enter to continue...", () => { rebuildPages(); askUser(); });
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', () => showUserProfile(username));
        });
    }

    askUser();
}

// ─── Businesses ───────────────────────────────────────────────────────────────

function showBusinesses(userData, businessData) {
    rl.resume();

    const chunksize = 4;
    let page = 0;
    let searchTerm = "";
    let bizNames, parsedBiz;

    function getFiltered() {
        const all = Object.keys(businessData);
        if (!searchTerm) return all;
        return all.filter(n => n.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    function rebuildPages() {
        bizNames = getFiltered();
        parsedBiz = [];
        for (let i = 0; i < bizNames.length; i += chunksize)
            parsedBiz.push(bizNames.slice(i, i + chunksize));
        if (page >= parsedBiz.length) page = Math.max(0, parsedBiz.length - 1);
    }

    rebuildPages();

    function askBiz() {
        clearScreen();

        if (bizNames.length === 0) {
            console.log(searchTerm ? `No businesses matching "${searchTerm}".` : "No businesses.");
            rl.question("\nPress Enter to go back...", () => {
                searchTerm = "";
                page = 0;
                rebuildPages();
                askBiz();
            });
            return;
        }

        const searchLabel = searchTerm ? ` [search: "${searchTerm}"]` : "";
        console.log(`=== Businesses (Page ${page + 1} of ${parsedBiz.length})${searchLabel} ===`);

        const currentPageItems = parsedBiz[page];
        for (let i = 0; i < currentPageItems.length; i++) {
            const biz = businessData[currentPageItems[i]];
            console.log(`  ${i + 1}. ${currentPageItems[i]} (${biz.category}) - ${biz.avg} stars`);
        }

        console.log("-----------------");
        console.log("  [1-4] Select business   [s] Search   [c] Clear search");
        console.log("  [n] Next page           [p] Prev page    [q] Main menu");
        console.log("=================");

        rl.question("Enter your choice: ", (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'q') { showMainMenu(userData, businessData); return; }

            if (choice === 's') {
                rl.question("Search: ", (term) => {
                    searchTerm = term.trim();
                    page = 0;
                    rebuildPages();
                    askBiz();
                });
                return;
            }

            if (choice === 'c') { searchTerm = ""; page = 0; rebuildPages(); askBiz(); return; }
            if (choice === 'n') { if (page < parsedBiz.length - 1) page++; askBiz(); return; }
            if (choice === 'p') { if (page > 0) page--; askBiz(); return; }

            const num = parseInt(choice);
            if (!isNaN(num) && num >= 1 && num <= currentPageItems.length) {
                showBizProfile(currentPageItems[num - 1]);
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', askBiz);
        });
    }

    function showBizProfile(name) {
        const biz = businessData[name];

        clearScreen();
        console.log("=== BUSINESS PROFILE ===");
        console.log(`Name:     ${name}`);
        console.log(`Owner:    ${biz.owner}`);
        console.log(`Category: ${biz.category}`);
        console.log(`Area:     ${biz.areaCode}`);
        console.log(`Rating:   ${biz.avg} (${biz.reviews.length} review${biz.reviews.length !== 1 ? "s" : ""})`);
        console.log("========================");
        console.log("  [c] Comments   [d] Delete   [b] Back");

        rl.question("Enter your choice: ", async (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'b') { askBiz(); return; }

            if (choice === 'c') { showComments(name, () => showBizProfile(name)); return; }

            if (choice === 'd') {
                const response = await requestAPI.delete(`/data/business/${encodeURIComponent(name)}`, { key: process.env.adminKey });
                if (response.statusCode === 200) {
                    delete businessData[name];
                    console.log(`\nBusiness "${name}" deleted.`);
                } else {
                    console.log("\nFailed to delete business:", response.data);
                }
                rl.question("\nPress Enter to continue...", () => { rebuildPages(); askBiz(); });
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', () => showBizProfile(name));
        });
    }

    function showComments(bizName, onBack) {
        const chunksize = 3;
        let page = 0;
        let pages;

        function rebuildCommentPages() {
            const reviews = businessData[bizName].reviews;
            pages = [];
            for (let i = 0; i < reviews.length; i += chunksize)
                pages.push(reviews.slice(i, i + chunksize));
            if (page >= pages.length) page = Math.max(0, pages.length - 1);
        }

        rebuildCommentPages();

        function askComment() {
            clearScreen();
            const reviews = businessData[bizName].reviews;

            if (reviews.length === 0) {
                console.log("No comments on this business.");
                rl.question("\nPress Enter to go back...", onBack);
                return;
            }

            console.log(`=== Comments: ${bizName} (Page ${page + 1} of ${pages.length}) ===`);

            const current = pages[page];
            const baseIndex = page * chunksize;

            for (let i = 0; i < current.length; i++) {
                const r = current[i];
                const preview = r.comment.length > 40 ? r.comment.slice(0, 40) + "..." : r.comment;
                console.log(`  ${i + 1}. [${r.stars} stars] ${r.user}: ${preview}`);
            }

            console.log("-----------------");
            console.log("  [1-3] View/delete comment   [n] Next   [p] Prev   [b] Back");
            console.log("=================");

            rl.question("Enter your choice: ", (input) => {
                const choice = input.trim().toLowerCase();

                if (choice === 'b') { onBack(); return; }
                if (choice === 'n') { if (page < pages.length - 1) page++; askComment(); return; }
                if (choice === 'p') { if (page > 0) page--; askComment(); return; }

                const num = parseInt(choice);
                if (!isNaN(num) && num >= 1 && num <= current.length) {
                    const globalIndex = baseIndex + (num - 1);
                    showCommentDetail(bizName, globalIndex, askComment, rebuildCommentPages);
                    return;
                }

                console.log("\nInvalid option. Press Enter to try again.");
                rl.once('line', askComment);
            });
        }

        askComment();
    }

    function showCommentDetail(bizName, index, onBack, rebuildCommentPages) {
        const r = businessData[bizName].reviews[index];

        clearScreen();
        console.log("=== COMMENT ===");
        console.log(`Business: ${bizName}`);
        console.log(`User:     ${r.user}`);
        console.log(`Stars:    ${r.stars}`);
        console.log(`Comment:  ${r.comment}`);
        console.log("===============");
        console.log("  [d] Delete   [b] Back");

        rl.question("Enter your choice: ", async (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'b') { onBack(); return; }

            if (choice === 'd') {
                const response = await requestAPI.delete(
                    `/data/business/${encodeURIComponent(bizName)}/comment/${index}`,
                    { key: process.env.adminKey }
                );
                if (response.statusCode === 200) {
                    businessData[bizName].reviews.splice(index, 1);
                    const reviews = businessData[bizName].reviews;
                    businessData[bizName].avg = reviews.length === 0
                        ? 0
                        : (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1);
                    console.log("\nComment deleted.");
                } else {
                    console.log("\nFailed to delete comment:", response.data);
                }
                rl.question("\nPress Enter to continue...", () => { rebuildCommentPages(); onBack(); });
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', () => showCommentDetail(bizName, index, onBack, rebuildCommentPages));
        });
    }

    askBiz();
}

// ─── Comments ─────────────────────────────────────────────────────────────────

function showAllComments(userData, businessData) {
    rl.resume();

    const chunksize = 4;
    let page = 0;
    let searchTerm = "";
    let flatComments, parsedComments;

    // Rebuild a flat list of {bizName, index, review} from live businessData
    function buildFlat() {
        const all = [];
        for (const [bizName, biz] of Object.entries(businessData)) {
            for (let i = 0; i < biz.reviews.length; i++)
                all.push({ bizName, index: i, review: biz.reviews[i] });
        }
        return all;
    }

    function getFiltered() {
        const lower = searchTerm.toLowerCase();
        return buildFlat().filter(c =>
            !searchTerm ||
            c.bizName.toLowerCase().includes(lower) ||
            c.review.user.toLowerCase().includes(lower)
        );
    }

    function rebuildPages() {
        flatComments = getFiltered();
        parsedComments = [];
        for (let i = 0; i < flatComments.length; i += chunksize)
            parsedComments.push(flatComments.slice(i, i + chunksize));
        if (page >= parsedComments.length) page = Math.max(0, parsedComments.length - 1);
    }

    rebuildPages();

    function askComment() {
        clearScreen();

        if (flatComments.length === 0) {
            if (searchTerm) {
                console.log(`No comments matching "${searchTerm}".`);
                rl.question("\nPress Enter to clear search...", () => {
                    searchTerm = "";
                    page = 0;
                    rebuildPages();
                    askComment();
                });
            } else {
                console.log("No comments found.");
                rl.question("\nPress Enter to go back...", () => showMainMenu(userData, businessData));
            }
            return;
        }

        const searchLabel = searchTerm ? ` [search: "${searchTerm}"]` : "";
        console.log(`=== Comments (Page ${page + 1} of ${parsedComments.length})${searchLabel} ===`);

        const current = parsedComments[page];
        for (let i = 0; i < current.length; i++) {
            const { bizName, review } = current[i];
            const preview = review.comment.length > 30 ? review.comment.slice(0, 30) + "..." : review.comment;
            console.log(`  ${i + 1}. [${review.stars}★] ${review.user} on ${bizName}: ${preview}`);
        }

        console.log("-----------------");
        console.log("  [1-4] Select comment   [s] Search   [c] Clear search");
        console.log("  [n] Next page          [p] Prev page    [q] Main menu");
        console.log("=================");

        rl.question("Enter your choice: ", (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'q') { showMainMenu(userData, businessData); return; }

            if (choice === 's') {
                rl.question("Search: ", (term) => {
                    searchTerm = term.trim();
                    page = 0;
                    rebuildPages();
                    askComment();
                });
                return;
            }

            if (choice === 'c') { searchTerm = ""; page = 0; rebuildPages(); askComment(); return; }
            if (choice === 'n') { if (page < parsedComments.length - 1) page++; askComment(); return; }
            if (choice === 'p') { if (page > 0) page--; askComment(); return; }

            const num = parseInt(choice);
            if (!isNaN(num) && num >= 1 && num <= current.length) {
                showCommentDetail(current[num - 1]);
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', askComment);
        });
    }

    function showCommentDetail({ bizName, index, review }) {
        clearScreen();
        console.log("=== COMMENT ===");
        console.log(`Business: ${bizName}`);
        console.log(`User:     ${review.user}`);
        console.log(`Stars:    ${review.stars}`);
        console.log(`Comment:  ${review.comment}`);
        console.log("===============");
        console.log("  [d] Delete   [b] Back");

        rl.question("Enter your choice: ", async (input) => {
            const choice = input.trim().toLowerCase();

            if (choice === 'b') { askComment(); return; }

            if (choice === 'd') {
                const response = await requestAPI.delete(
                    `/data/business/${encodeURIComponent(bizName)}/comment/${index}`,
                    { key: process.env.adminKey }
                );
                if (response.statusCode === 200) {
                    businessData[bizName].reviews.splice(index, 1);
                    const reviews = businessData[bizName].reviews;
                    businessData[bizName].avg = reviews.length === 0
                        ? 0
                        : (reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length).toFixed(1);
                    console.log("\nComment deleted.");
                } else {
                    console.log("\nFailed to delete comment:", response.data);
                }
                rl.question("\nPress Enter to continue...", () => { rebuildPages(); askComment(); });
                return;
            }

            console.log("\nInvalid option. Press Enter to try again.");
            rl.once('line', () => showCommentDetail({ bizName, index, review }));
        });
    }

    askComment();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

(async function () {
    const result = await initialData;

    if (!result || result.usersRes.statusCode !== 200) {
        console.error("Failed to load users:", result?.usersRes);
        process.exit(1);
    }

    if (result.businessRes.statusCode !== 200) {
        console.error("Failed to load businesses:", result.businessRes);
        process.exit(1);
    }

    showMainMenu(result.usersRes.data, result.businessRes.data);
})();
