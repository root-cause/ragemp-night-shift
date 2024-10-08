import { waitFor } from "../util";

// event handlers
async function init() {
    mp.game.misc.setFadeOutAfterDeath(false);

    // freeze and put the local player outside of the factory
    mp.players.local.freezePosition(true);
    mp.players.local.setCoordsNoOffset(-140.21, 6201.75, 31.5, false, false, false);

    // disable nametags
    mp.nametags.enabled = false;

    // create blockers
    mp.objects.new("m23_2_prop_m32_cfdoor_front_01a", new mp.Vector3(-70.962, 6265.914, 30.104), { rotation: new mp.Vector3(0.0, 0.0, 32.875) });
    mp.objects.new("m23_2_prop_m32_cfdoor_back_01a", new mp.Vector3(-142.889, 6143.792, 31.333), { rotation: new mp.Vector3(0.0, 0.0, -135.136) });
    mp.objects.new("m23_2_prop_m32_cfdoor_front_01a", new mp.Vector3(-176.314, 6166.846, 33.505), { rotation: new mp.Vector3(0.0, -179.809, 134.836) });
    mp.objects.new("m23_2_prop_m32_cfdoor_front_01a", new mp.Vector3(-175.8, 6166.327, 33.411), { rotation: new mp.Vector3(0.0, 0.0, 134.832) });

    // load the factory ipls
    const ipls = ["cs1_02_cf_onmission1", "cs1_02_cf_onmission2", "cs1_02_cf_onmission3", "cs1_02_cf_onmission4"];
    const iplPromises = ipls.map(iplName => {
        mp.game.streaming.requestIpl(iplName);
        return waitFor(() => mp.game.streaming.isIplActive(iplName));
    });

    await Promise.all(iplPromises);

    // load the interiors
    const interiorIds = [
        mp.game.interior.getInteriorAtCoordsWithType(-76.6618, 6222.1914, 32.2412, "v_factory1"),
        mp.game.interior.getInteriorAtCoordsWithType(-98.2637, 6210.0225, 31.924, "v_factory2"),
        mp.game.interior.getInteriorAtCoordsWithType(-115.8956, 6179.7485, 32.4102, "v_factory3"),
        mp.game.interior.getInteriorAtCoordsWithType(-149.8199, 6144.9775, 31.3353, "v_factory4"),
    ];

    const interiorPromises = interiorIds.map(interiorId => {
        mp.game.interior.pinInMemory(interiorId);
        return waitFor(() => mp.game.interior.isReady(interiorId));
    });

    await Promise.all(interiorPromises);

    // activate the interiors
    for (const interiorId of interiorIds) {
        mp.game.interior.disable(interiorId, false);
        mp.game.interior.cap(interiorId, false);
    }

    // load hunter spawn anim
    mp.game.streaming.requestAnimDict("anim@mp_player_intcelebrationmale@chicken_taunt");
    await waitFor(() => mp.game.streaming.hasAnimDictLoaded("anim@mp_player_intcelebrationmale@chicken_taunt"));

    // let the server know
    mp.events.callRemote("nightshift::ready");
}

// register event handlers
mp.events.add("playerReady", init);
