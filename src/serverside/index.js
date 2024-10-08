import { DUMMY_TYPE_GAME } from "../shared/constants/DummyType";
import { STATE_WAITING, STATE_PLAYING, STATE_ENDED } from "../shared/constants/State";
import { REASON_NONE, REASON_NO_HUNTED_LEFT, REASON_NO_HUNTER_LEFT, REASON_ROUND_TIME } from "../shared/constants/EndReason";
import { TEAM_NONE, TEAM_HUNTED, TEAM_HUNTER } from "../shared/constants/Team";

// script constants
const A_C_HEN = mp.joaat("a_c_hen");

const HUNTED_SPAWNS = [
    // heading is randomized for the hunted
    { position: new mp.Vector3(-63.8323, 6240.2354, 30.0891), heading: 0.0 },
    { position: new mp.Vector3(-61.2365, 6238.0791, 30.0898), heading: 0.0 },
    { position: new mp.Vector3(-65.5019, 6241.6475, 30.0869), heading: 0.0 },
    { position: new mp.Vector3(-63.8346, 6237.6904, 30.0900), heading: 0.0 },
    { position: new mp.Vector3(-66.5009, 6243.3975, 30.0855), heading: 0.0 },
    { position: new mp.Vector3(-66.4787, 6246.7471, 30.1467), heading: 0.0 },
    { position: new mp.Vector3(-66.6690, 6237.1426, 30.0911), heading: 0.0 },
    { position: new mp.Vector3(-68.1682, 6241.7627, 30.0815), heading: 0.0 },
    { position: new mp.Vector3(-64.5607, 6234.9639, 30.0900), heading: 0.0 },
    { position: new mp.Vector3(-68.8173, 6239.7861, 30.0858), heading: 0.0 },
    { position: new mp.Vector3(-70.3084, 6242.4019, 30.0724), heading: 0.0 },
    { position: new mp.Vector3(-68.4036, 6247.4277, 30.0872), heading: 0.0 },
    { position: new mp.Vector3(-66.7651, 6248.8291, 30.0898), heading: 0.0 },
    { position: new mp.Vector3(-69.9978, 6244.3809, 30.0703), heading: 0.0 },
    { position: new mp.Vector3(-70.4979, 6246.3457, 30.0711), heading: 0.0 }
];

const HUNTER_SPAWNS = [
    { position: new mp.Vector3(-68.7745, 6255.0136, 31.0901), heading: 125.0 },
    { position: new mp.Vector3(-103.4545, 6193.5273, 31.0254), heading: -50.0 },
    { position: new mp.Vector3(-146.5500, 6162.7202, 31.2061), heading: -135.0 }
];

const MIN_PLAYERS = mp.config["nightshift.min_players"] || 2;
const ROUND_SECONDS = mp.config["nightshift.round_seconds"] || 300;
const WAIT_SECONDS = mp.config["nightshift.wait_seconds"] || 20;
const RESPAWN_SECONDS = mp.config["nightshift.respawn_seconds"] || 7;
const HUNTER_WEAPON = mp.config["nightshift.hunter_weapon"] || mp.joaat("WEAPON_PUMPSHOTGUN");
const HUNTER_AMMO = mp.config["nightshift.hunter_ammo"] || 40;

// script functions
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled);
}

function getReadyPlayerCount() {
    let result = 0;
    mp.players.forEach(player => {
        if (player._isReady) {
            result++;
        }
    });

    return result;
}

function getPlayerCountByTeam(team) {
    let result = 0;
    mp.players.forEach(player => {
        if (player.getOwnVariable("team") === team) {
            result++;
        }
    });

    return result;
}

function spawnPlayer(player) {
    if (!player._isReady) {
        return;
    }

    if (player._respawnTimer) {
        clearTimeout(player._respawnTimer);
        delete player._respawnTimer;
    }

    // game in progress, make the player spectate instead
    if (game.getVariable("state") === STATE_PLAYING) {
        player.setOwnVariable("isSpectator", true);
        return;
    }

    player.setOwnVariable("isSpectator", false);

    switch (player.getOwnVariable("team")) {
        case TEAM_NONE:
        case TEAM_HUNTED:
            player.model = A_C_HEN;
            player.spawn(HUNTED_SPAWNS[getRandomInt(0, HUNTED_SPAWNS.length)].position, getRandomInt(-360.0, 360.0));
            break;

        case TEAM_HUNTER:
            // random customization - guaranteed to generate hideous fuckers
            const firstDude = getRandomInt(0, 21);
            const secondDude = getRandomInt(0, 21);
            const randomFeatures = new Array(20);
            for (let i = 0; i < randomFeatures.length; i++) {
                randomFeatures[i] = Math.random() * 2 - 1;
            }

            player.setCustomization(true, firstDude, secondDude, 0, firstDude, secondDude, 0, Math.random(), Math.random(), 0.0, 0, 0, 0, randomFeatures);

            const spawnPoint = HUNTER_SPAWNS[getRandomInt(0, HUNTER_SPAWNS.length)];
            player.spawn(spawnPoint.position, spawnPoint.heading);
            player.giveWeapon(HUNTER_WEAPON, HUNTER_AMMO);
            player.setClothes(3, 64, 0, 0);
            player.setClothes(4, 191, 0, 0);
            player.setClothes(6, 111, 4, 0);
            player.setClothes(8, 15, 0, 0);
            player.setClothes(10, 183, 0, 0);
            player.setClothes(11, 519, 0, 0);
            player.setProp(0, 131, 4);
            break;
    }
}

function removePlayerFromGame(player) {
    const playerTeam = player.getOwnVariable("team");
    if (playerTeam === TEAM_NONE) {
        return;
    }

    player.setOwnVariable("team", TEAM_NONE);

    // game ends if either team has no players left
    const playersInTeam = getPlayerCountByTeam(playerTeam);
    if (playersInTeam <= 0) {
        changeGameState(STATE_ENDED, playerTeam === TEAM_HUNTER ? REASON_NO_HUNTER_LEFT : REASON_NO_HUNTED_LEFT);
        return;
    }

    if (playerTeam === TEAM_HUNTED) {
        game.setVariable("huntedLeft", playersInTeam);
    }
}

function changeGameState(newState, endReason = REASON_NONE) {
    if (game.getVariable("state") === newState) {
        return;
    }

    if (stateTimer) {
        clearTimeout(stateTimer);
        stateTimer = null;
    }

    switch (newState) {
        case STATE_WAITING:
            mp.players.forEach(spawnPlayer);
            break;

        case STATE_PLAYING:
            if (getReadyPlayerCount() < MIN_PLAYERS) {
                mp.players.broadcast(`* Not enough players to start a new round!`);
                changeGameState(STATE_WAITING);
                return;
            }

            const readyPlayers = mp.players.toArray().filter(player => player._isReady);

            // shuffle the ready players array (https://stackoverflow.com/a/12646864)
            for (let i = readyPlayers.length - 1; i >= 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [readyPlayers[i], readyPlayers[j]] = [readyPlayers[j], readyPlayers[i]];
            }

            // the last player in the shuffled array becomes the hunter
            // this can be changed to pick multiple hunters but just one is already powerful enough
            const hunter = readyPlayers.pop();
            hunter.setOwnVariable("team", TEAM_HUNTER);
            spawnPlayer(hunter);

            // other players become the hunted
            readyPlayers.forEach(player => {
                player.setOwnVariable("team", TEAM_HUNTED);
                spawnPlayer(player);
            });

            game.setVariables({ timeLeft: ROUND_SECONDS, huntedLeft: readyPlayers.length });
            stateTimer = setTimeout(updateTimeLeft, 1000);
            break;

        case STATE_ENDED:
            mp.players.forEach(player => {
                player.setOwnVariable("team", TEAM_NONE);
                player.removeAllWeapons();
            });

            mp.players.call("nightshift::end_shard", [endReason]);
            mp.players.broadcast(`* Next round in ${WAIT_SECONDS} seconds...`);
            stateTimer = setTimeout(changeGameState, WAIT_SECONDS * 1000, STATE_PLAYING);
            break;
    }

    game.setVariable("state", newState);
}

function updateTimeLeft() {
    if (game.getVariable("state") !== STATE_PLAYING) {
        return;
    }

    const seconds = game.getVariable("timeLeft") - 1;
    if (seconds <= 0) {
        changeGameState(STATE_ENDED, REASON_ROUND_TIME);
        return;
    }

    game.setVariable("timeLeft", seconds);
    stateTimer = setTimeout(updateTimeLeft, 1000);
}

// event handlers
function onPlayerReady(player) {
    if (player._isReady) {
        return;
    }

    // player variables
    player._isReady = true;
    player.setOwnVariable("team", TEAM_NONE);

    if (game.getVariable("state") === STATE_WAITING && stateTimer == null && getReadyPlayerCount() >= MIN_PLAYERS) {
        mp.players.broadcast(`* Next round in ${WAIT_SECONDS} seconds...`);
        stateTimer = setTimeout(changeGameState, WAIT_SECONDS * 1000, STATE_PLAYING);
    }

    spawnPlayer(player);
}

function onPlayerChat(player, message) {
    if (player.getOwnVariable("isSpectator")) {
        player.outputChatBox("* Spectators cannot chat.");
        return;
    }

    mp.players.broadcast(`${player.name} (${player.id}): ${message}`);
}

function onPlayerDeath(player, reason, killer) {
    mp.players.call("nightshift::death_ticker", [player, killer]);

    if (player._respawnTimer == null && !player.getOwnVariable("isSpectator")) {
        player._respawnTimer = setTimeout(spawnPlayer, RESPAWN_SECONDS * 1000, player);
    }

    if (game.getVariable("state") === STATE_PLAYING) {
        removePlayerFromGame(player);
    }
}

function onPlayerQuit(player) {
    if (player._respawnTimer) {
        clearTimeout(player._respawnTimer);
        delete player._respawnTimer;
    }

    if (game.getVariable("state") === STATE_PLAYING) {
        removePlayerFromGame(player);
    }

    delete player._isReady;
}

// startup code
const game = mp.dummies.new(DUMMY_TYPE_GAME, 0, { state: STATE_WAITING, timeLeft: 0, huntedLeft: 0 });
let stateTimer = null;

mp.world.time.set(0, 0, 0);

// register event handlers
mp.events.add({
    "nightshift::ready": onPlayerReady,
    "playerChat": onPlayerChat,
    "playerDeath": onPlayerDeath,
    "playerQuit": onPlayerQuit,
});

// register commands
mp.events.addCommand("giveup", (player) => {
    if (player.getOwnVariable("isSpectator")) {
        player.outputChatBox("* Spectators cannot give up.");
        return;
    }

    player.health = 0;
});
