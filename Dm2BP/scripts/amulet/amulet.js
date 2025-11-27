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

// A���A���nh xA���A���A��� mob -> item amulet
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

// danh sA���A���ch cA���A���c amulet A,���?~A���A���Ay
const FilledAmulets = Object.values(MobToAmulet);

function safeStructureName(entityId) {
    const cleaned = entityId.replace(/[^A-Za-z0-9_-]/g, "");
    return cleaned.length > 0 ? `dm2_${cleaned}` : `dm2_${Date.now()}`;
}

world.afterEvents.entityHitEntity.subscribe(async (data) => {
    try {
        const { damagingEntity, hitEntity } = data;
        if (!damagingEntity || damagingEntity.typeId !== "minecraft:player" || !hitEntity) return;

        const family = hitEntity.getComponent("type_family");
        if (
            !AllowedMobs.includes(hitEntity.typeId) ||
            EntitiesDeny.includes(hitEntity.typeId) ||
            hitEntity.typeId === "minecraft:painting" ||
            family.hasTypeFamily("npc") ||
            family.hasTypeFamily("inanimate")
        ) return;
        
        const isTamed = hitEntity.getComponent("minecraft:is_tamed");
        if (!isTamed || (typeof isTamed.value === "boolean" && !isTamed.value)) return;

        let equipComp;
        try {
            equipComp = damagingEntity.getComponent("equippable");
        } catch (err) {
            return;
        }
        const equipment = equipComp?.getEquipment("Mainhand");
        if (!equipment || equipment.typeId !== "dragonmountsplus:amulet") return;

        const { x, y, z } = hitEntity.location;
        const structureName = safeStructureName(hitEntity.id);

        // nA���A���A���u mob nA���A���A���m trong bA���A���A���ng map thA���A��� A,���?~A���A������?���i item
        if (equipment.getLore().length === 0 && MobToAmulet[hitEntity.typeId]) {
            const newItem = new ItemStack(MobToAmulet[hitEntity.typeId], 1);
            newItem.setLore([`Name: ${hitEntity.typeId}`, `ID: ${structureName}`]);

            // Chi loai bo dragon neu luu thanh cong de tranh mat du lieu
            const sx = Math.floor(x);
            const sy = Math.floor(y);
            const sz = Math.floor(z);
            const saveResult = await hitEntity.runCommandAsync(`structure save "${structureName}" ${sx} ${sy} ${sz} ${sx} ${sy} ${sz} true disk false`).catch(() => null);

            if (saveResult?.successCount) {
                hitEntity.runCommandAsync(`ride @a[r=3.1] stop_riding`);
                hitEntity.runCommandAsync(`playsound mob.endermen.portal @a ${x} ${y} ${z} 1 1 `);
                hitEntity.remove();
                equipComp.setEquipment("Mainhand", newItem);
            }
        };
    } catch (err) {
        return;
    }
});

function registerAmulet(itemId, returnEmpty) {
    world.beforeEvents.worldInitialize.subscribe((data) => {
        data.itemComponentRegistry.registerCustomComponent(itemId, {
            onUseOn: ((event) => {
                const { block, blockFace, source, itemStack } = event;
                if (!source || source.typeId !== "minecraft:player") return;
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
                    const structureName = itemStack.getLore()[1].replace("ID: ", "");
                    source.runCommand(`structure load "${structureName}" ${x} ${y} ${z}`);
                    source.runCommand(`structure delete "${structureName}"`);
                    source.runCommand(`playsound mob.endermen.portal @a ${x} ${y} ${z} 1 1 `);

                    const playerEquip = source.getComponent("equippable");
                    if (returnEmpty) {
                        // A,���?~A���A������?���i lA���A���A���i thA���A���nh amulet trA���A������?~ng
                        const emptyAmulet = new ItemStack("dragonmountsplus:amulet", 1);
                        playerEquip?.setEquipment("Mainhand", emptyAmulet);
                    } else {
                        // nA���A���A���u lA���A��� amulet rA���A������?"ng thA���A��� chA���A������?��� xA���A3a lore
                        itemStack.setLore([]);
                        playerEquip?.setEquipment("Mainhand", itemStack);
                    }
                };
            })
        });
    });
}

// A,���?~A,���'ng kA���A��� cho amulet rA���A������?"ng
registerAmulet("dragonmountsplus:amulet", false);

// A,���?~A,���'ng kA���A��� cho tA���A���A���t cA���A���A��� amulet A,���?~A���A���Ay (sau khi dA���A1ng thA���A��� trA���A���A��� vA���A���A? rA���A������?"ng)
FilledAmulets.forEach(id => registerAmulet(id, true));
