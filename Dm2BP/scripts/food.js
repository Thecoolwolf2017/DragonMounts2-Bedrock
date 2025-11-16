import { world, Player } from "@minecraft/server";

function applyEffect(player, effectId, duration, amplifier = 0) {
	if (!(player instanceof Player)) return;
	player.addEffect(effectId, duration, { amplifier, showParticles: false });
}

world.beforeEvents.worldInitialize.subscribe(initEvent => {
	initEvent.itemComponentRegistry.registerCustomComponent("dragonmountsplus_raw_dragon_meat:trigger", {
		onConsume({ source }) {
			if (!(source instanceof Player)) return;

			applyEffect(source, "hunger", 200, 1);
			applyEffect(source, "poison", 60, 0);
		}
	});

	initEvent.itemComponentRegistry.registerCustomComponent("dragonmountsplus_cooked_dragon_meat:trigger", {
		onConsume({ source }) {
			if (!(source instanceof Player)) return;

			applyEffect(source, "regeneration", 120, 1);
			applyEffect(source, "strength", 200, 0);
		}
	});
});
