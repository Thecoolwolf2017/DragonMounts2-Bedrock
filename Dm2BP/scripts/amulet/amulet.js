import { world, ItemStack } from "@minecraft/server";

const EntitiesDeny = [
    "minecraft:ender_crystal",
    "minecraft:ender_dragon",
    "minecraft:falling_block",
    "minecraft:player",
    "minecraft:warden",
    "minecraft:wither"
];

const AllowedMobs = [
    "dragonmountsplus:aether_dragon",
    "dragonmountsplus:dark_dragon",
    "dragonmountsplus:ender_dragon",
    "dragonmountsplus:moonlight_dragon",
    "dragonmountsplus:sculk_dragon",
    "dragonmountsplus:storm_dragon",
    "dragonmountsplus:sunlight_dragon",
    "dragonmountsplus:terra_dragon",
    "dragonmountsplus:enchant_dragon",
    "dragonmountsplus:nether_dragon",
    "dragonmountsplus:ice_dragon",
    "dragonmountsplus:fire_dragon",
    "dragonmountsplus:forest_dragon",
    "dragonmountsplus:water_dragon",
    "dragonmountsplus:skeleton_dragon",
    "dragonmountsplus:wither_dragon",
    "dragonmountsplus:zombie_dragon"
];  

// Ã¡nh xáº¡ mob -> item amulet
const MobToAmulet = {
    "dragonmountsplus:aether_dragon": "dragonmountsplus:aether_amulet",
    "dragonmountsplus:dark_dragon": "dragonmountsplus:dark_amulet",
    "dragonmountsplus:ender_dragon": "dragonmountsplus:ender_amulet",
    "dragonmountsplus:nether_dragon": "dragonmountsplus:nether_amulet",
    "dragonmountsplus:ice_dragon": "dragonmountsplus:ice_amulet",
    "dragonmountsplus:fire_dragon": "dragonmountsplus:fire_amulet",
    "dragonmountsplus:forest_dragon": "dragonmountsplus:forest_amulet",
    "dragonmountsplus:water_dragon": "dragonmountsplus:water_amulet",
    "dragonmountsplus:skeleton_dragon": "dragonmountsplus:skeleton_amulet",
    "dragonmountsplus:moonlight_dragon": "dragonmountsplus:moonlight_amulet",
    "dragonmountsplus:sculk_dragon": "dragonmountsplus:sculk_amulet",
    "dragonmountsplus:enchant_dragon": "dragonmountsplus:enchant_amulet",
    "dragonmountsplus:storm_dragon": "dragonmountsplus:storm_amulet",
    "dragonmountsplus:sunlight_dragon": "dragonmountsplus:sunlight_amulet",
    "dragonmountsplus:terra_dragon": "dragonmountsplus:terra_amulet",
    "dragonmountsplus:wither_dragon": "dragonmountsplus:wither_amulet",
    "dragonmountsplus:zombie_dragon": "dragonmountsplus:zombie_amulet"
};

// danh sÃ¡ch cÃ¡c amulet Ä‘áº§y
const FilledAmulets = Object.values(MobToAmulet);

world.afterEvents.entityHitEntity.subscribe((data) => {
    const { damagingEntity, hitEntity } = data;
    if (damagingEntity.typeId != "minecraft:player") return;

    const family = hitEntity.getComponent("type_family");
    if (
        !AllowedMobs.includes(hitEntity.typeId) ||
        EntitiesDeny.includes(hitEntity.typeId) ||
        hitEntity.typeId == "minecraft:painting" ||
        family.hasTypeFamily("npc") ||
        family.hasTypeFamily("inanimate")
    ) return;
    
    const isTamed = hitEntity.getComponent("minecraft:is_tamed");
    if (!isTamed || (typeof isTamed.value === "boolean" && !isTamed.value)) return;

    const equipment = damagingEntity.getComponent("equippable").getEquipment("Mainhand");
    if (!equipment || equipment.typeId != "dragonmountsplus:amulet") return;

    const { x, y, z } = hitEntity.location;

    // náº¿u mob náº±m trong báº£ng map thÃ¬ Ä‘á»•i item
    if (equipment.getLore().length == 0 && MobToAmulet[hitEntity.typeId]) {
        const newItem = new ItemStack(MobToAmulet[hitEntity.typeId], 1);
        newItem.setLore([`Name: ${hitEntity.typeId}`, `ID: ${hitEntity.id}`]);
        damagingEntity.getComponent("equippable").setEquipment("Mainhand", newItem);

        // xá»­ lÃ½ lÆ°u mob
        hitEntity.runCommand(`ride @a[r=3.1] stop_riding`);
        hitEntity.runCommand(`tp ${x} ${y + 320} ${z}`);
        hitEntity.runCommand(`structure save "${hitEntity.id}" ${x} ${y + 320} ${z} ${x} ${y + 320} ${z} true disk false`);
        hitEntity.runCommand(`playsound mob.endermen.portal @a ${x} ${y} ${z} 1 1 `);
        hitEntity.remove();
    };
});

function registerAmulet(itemId, returnEmpty) {
    world.beforeEvents.worldInitialize.subscribe((data) => {
        data.itemComponentRegistry.registerCustomComponent(itemId, {
            onUseOn: ((event) => {
                const { block, blockFace, source, itemStack } = event;
                const pos = block.location;
                const direction = {
                    "North": {x: pos.x +0.5, y: pos.y, z: pos.z -0.5},
                    "South": {x: pos.x +0.5, y: pos.y, z: pos.z +1.5},
                    "East": {x: pos.x +1.5, y: pos.y, z: pos.z +0.5},
                    "West": {x: pos.x -0.5, y: pos.y, z: pos.z +0.5},
                    "Up": {x: pos.x +0.5, y: pos.y +1, z: pos.z +0.5},
                    "Down": {x: pos.x +0.5, y: pos.y -1, z: pos.z +0.5}
                };
                const { x, y, z } = direction[blockFace];

                if (itemStack.getLore().length > 0) {
                    source.runCommand(`structure load "${Number(itemStack.getLore()[1].replace("ID: ", ""))}" ${x} ${y} ${z}`);
                    source.runCommand(`structure delete "${Number(itemStack.getLore()[1].replace("ID: ", ""))}"`);
                    source.runCommand(`playsound mob.endermen.portal @a ${x} ${y} ${z} 1 1 `);

                    if (returnEmpty) {
                        // Ä‘á»•i láº¡i thÃ nh amulet trá»‘ng
                        const emptyAmulet = new ItemStack("dragonmountsplus:amulet", 1);
                        source.getComponent("equippable").setEquipment("Mainhand", emptyAmulet);
                    } else {
                        // náº¿u lÃ  amulet rá»—ng thÃ¬ chá»‰ xÃ³a lore
                        itemStack.setLore([]);
                        source.getComponent("equippable").setEquipment("Mainhand", itemStack);
                    }
                };
            })
        });
    });
}

// Ä‘Äƒng kÃ½ cho amulet rá»—ng
registerAmulet("dragonmountsplus:amulet", false);

// Ä‘Äƒng kÃ½ cho táº¥t cáº£ amulet Ä‘áº§y (sau khi dÃ¹ng thÃ¬ tráº£ vá» rá»—ng)
FilledAmulets.forEach(id => registerAmulet(id, true));
