import { TEAM_HUNTED, TEAM_HUNTER } from "../../shared/constants/Team";
import { DUMMY_TYPE_GAME } from "../../shared/constants/DummyType";
import { STATE_WAITING, STATE_PLAYING, STATE_ENDED } from "../../shared/constants/State";
import { REASON_NO_HUNTED_LEFT, REASON_NO_HUNTER_LEFT, REASON_ROUND_TIME } from "../../shared/constants/EndReason";
import { runScaleformMethod, waitFor } from "../util";

// @ts-ignore - this is an external resource
const timerBarPool = require("timerbars");

// @ts-ignore - this is an external resource
const TextTimerBar = require("timerbars/classes/TextTimerBar");

// script variables
let scaleformHandle = 0;
let timeBar = null;
let chickensBar = null;

// script functions
function setBusyspinnerState(state) {
    switch (state) {
        case STATE_WAITING:
            mp.game.hud.beginTextCommandBusyspinnerOn("STRING");
            mp.game.hud.addTextComponentSubstringPlayerName("Waiting for players...");
            mp.game.hud.endTextCommandBusyspinnerOn(1);
            break;

        case STATE_PLAYING:
            mp.game.hud.busyspinnerOff();
            break;

        case STATE_ENDED:
            mp.game.hud.beginTextCommandBusyspinnerOn("STRING");
            mp.game.hud.addTextComponentSubstringPlayerName("Waiting for the next round...");
            mp.game.hud.endTextCommandBusyspinnerOn(1);
            break;
    }
}

function setTimerBarsState(state) {
    switch (state) {
        case STATE_PLAYING:
            timerBarPool.add(timeBar, chickensBar);
            break;

        default:
            timerBarPool.clear();
    }
}

function updateTimeBar(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    timeBar.text = `${minutes < 10 ? `0${minutes}` : minutes}:${remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}`;

    // probably not the best way to do this
    if (seconds <= 30) {
        timeBar.textColor = 6; // HUD_COLOUR_RED
        timeBar.highlightColor = 8; // HUD_COLOUR_REDDARK
    } else {
        timeBar.textColor = 1; // HUD_COLOUR_WHITE
        timeBar.highlightColor = null;
    }
}

function showMidsizedMessage(title, text) {
    if (scaleformHandle === 0) {
        return;
    }

    mp.game.audio.playSoundFrontend(-1, "Shard_Appear", "GTAO_FM_Events_Soundset", false);
    runScaleformMethod(scaleformHandle, "SHOW_SHARD_MIDSIZED_MESSAGE", title, text);
    setTimeout(hideMidsizedMessage, 5000);
}

function hideMidsizedMessage() {
    if (scaleformHandle === 0) {
        return;
    }

    mp.game.audio.playSoundFrontend(-1, "Shard_Disappear", "GTAO_FM_Events_Soundset", false);
    runScaleformMethod(scaleformHandle, "SHARD_ANIM_OUT");
}

// event handlers
async function init() {
    timeBar = new TextTimerBar("TIME LEFT", "--:--");
    chickensBar = new TextTimerBar("CHICKENS LEFT", "-");

    // load midsized_message
    scaleformHandle = mp.game.graphics.requestScaleformMovie("midsized_message");
    await waitFor(() => mp.game.graphics.hasScaleformMovieLoaded(scaleformHandle));

    // there is only one dummy of DUMMY_TYPE_GAME type, read data from it
    mp.dummies.forEachByType(DUMMY_TYPE_GAME, dummy => {
        const state = dummy.getVariable("state");
        setBusyspinnerState(state);
        setTimerBarsState(state);

        const timeLeft = dummy.getVariable("timeLeft");
        updateTimeBar(timeLeft);

        const huntedLeft = dummy.getVariable("huntedLeft");
        chickensBar.text = huntedLeft.toString();
    });
}

function handleHud() {
    if (scaleformHandle) {
        mp.game.graphics.drawScaleformMovieFullscreen(scaleformHandle, 255, 255, 255, 255, 0);
    }

    if (mp.players.local.isDead() || !mp.game.cam.isGameplayRendering()) {
        mp.game.hud.hideAndRadarThisFrame();
    } else {
        mp.game.hud.hideMinimapExteriorMapThisFrame();
    }
}

function onLocalPlayerSpawn() {
    switch (mp.players.local.getVariable("team")) {
        case TEAM_HUNTED:
            showMidsizedMessage("Hunted", "Survive until the timer runs out.");

            mp.game.hud.beginTextCommandPrint("STRING");
            mp.game.hud.addTextComponentSubstringPlayerName("Survive the ~r~hunter.");
            mp.game.hud.endTextCommandPrint(3600000, true);
            break;

        case TEAM_HUNTER:
            showMidsizedMessage("Hunter", "Eliminate all chickens before the timer runs out.");

            mp.game.hud.beginTextCommandPrint("STRING");
            mp.game.hud.addTextComponentSubstringPlayerName("Hunt the ~r~chickens.");
            mp.game.hud.endTextCommandPrint(3600000, true);
            break;

        default:
            mp.game.hud.clearPrints();
    }
}

function onGameEnd(reason) {
    switch (reason) {
        case REASON_NO_HUNTED_LEFT:
            showMidsizedMessage("Round Over", "All chickens have been eliminated.");
            break;

        case REASON_NO_HUNTER_LEFT:
            showMidsizedMessage("Round Over", "The hunter gave up.");
            break;

        case REASON_ROUND_TIME:
            showMidsizedMessage("Round Over", "The chickens outsmarted the hunter.");
            break;
    }
}

function cleanUp(player) {
    if (player !== mp.players.local) {
        return;
    }

    // remove the objective text and spinner
    mp.game.hud.clearPrints();
    mp.game.hud.busyspinnerOff();

    // free midsized_message
    if (scaleformHandle) {
        mp.game.graphics.setScaleformMovieAsNoLongerNeeded(scaleformHandle);
        scaleformHandle = 0;
    }

    // free timerbars
    timerBarPool.clear();

    if (timeBar) {
        timeBar.resetGxt();
        timeBar = null;
    }

    if (chickensBar) {
        chickensBar.resetGxt();
        chickensBar = null;
    }
}

// data change handlers
function onGameStateChange(entity, newState) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_GAME) {
        return;
    }

    if (newState === STATE_ENDED) {
        mp.game.hud.clearPrints();
    }

    setBusyspinnerState(newState);
    setTimerBarsState(newState);
}

function onGameTimeLeftChange(entity, newTimeLeft) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_GAME) {
        return;
    }

    updateTimeBar(newTimeLeft);
}

function onGameHuntedLeftChange(entity, newHuntedLeft) {
    if (entity.typeInt !== 9 /* dummy */ || entity.dummyType !== DUMMY_TYPE_GAME) {
        return;
    }

    chickensBar.text = newHuntedLeft.toString();
}

// register event handlers
mp.events.add({
    "playerReady": init,
    "render": handleHud,
    "playerSpawn": onLocalPlayerSpawn,
    "nightshift::end_shard": onGameEnd,
    "playerQuit": cleanUp,
});

// register data change handlers
mp.events.addDataHandler("state", onGameStateChange);
mp.events.addDataHandler("timeLeft", onGameTimeLeftChange);
mp.events.addDataHandler("huntedLeft", onGameHuntedLeftChange);
