import { TEAM_HUNTER } from "../../shared/constants/Team";

// script constants
const STATS_TO_MAX = [
    mp.game.joaat("SP0_STAMINA"), mp.game.joaat("SP0_STRENGTH"), mp.game.joaat("SP0_LUNG_CAPACITY"), mp.game.joaat("SP0_WHEELIE_ABILITY"),
    mp.game.joaat("SP0_FLYING_ABILITY"), mp.game.joaat("SP0_SHOOTING_ABILITY"), mp.game.joaat("SP0_STEALTH_ABILITY")
];

// event handlers
function onLocalPlayerSpawn() {
    mp.game.misc.setFadeOutAfterDeath(false);
    mp.game.player.setHealthRechargeMultiplier(0.0);

    // unfreeze player
    mp.players.local.freezePosition(false);

    // max out stats for better gameplay
    STATS_TO_MAX.forEach(statHash => mp.game.stats.statSetInt(statHash, 100, false));

    // clear the death effects
    mp.game.graphics.animpostfxStop("DeathFailMPIn");
    mp.game.cam.setEffect(0);

    // do a spawn animation for the hunter
    if (mp.players.local.getVariable("team") === TEAM_HUNTER) {
        mp.players.local.taskPlayAnim("anim@mp_player_intcelebrationmale@chicken_taunt", "chicken_taunt", 8.0, -8.0, -1, 1048576, 0.0, false, false, false);
    }
}

function onLocalPlayerDeath() {
    mp.game.audio.playSoundFrontend(-1, "Bed", "WastedSounds", false);

    // apply the death effects
    mp.game.graphics.animpostfxPlay("DeathFailMPIn", 0, true);
    mp.game.cam.setEffect(1);
}

// register event handlers
mp.events.add({
    "playerSpawn": onLocalPlayerSpawn,
    "playerDeath": onLocalPlayerDeath
});
