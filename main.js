import Pokedex from 'pokedex-promise-v2';
import {readFileSync, writeFileSync} from 'fs';
import { debug } from 'console';
const p = new Pokedex();

const wanted = []

readFileSync('my-pokemon.txt').toString().split('\n').forEach(entry => wanted.push(entry.trim().toLowerCase()))

const pokemons = await p.getPokemonsList().then(pokemon => pokemon.results.filter(pokemon => wanted.includes(pokemon.name)))

const pokemonOut = []
const moveNames = []
const moveOut = []
const GrowthRates = []
console.log("Filtering done")

const capitalize = (input) => {
    return input[0].toUpperCase() + input.substring(1).toLowerCase();
}

const mapTarget = (target) => {
    return target === 'user' ? 'self' : 'foe'
}

const process = async (pokemon) => {
    try {
        const obj = {
            name: capitalize(pokemon.name),
            frontSprite: 'f_' + pokemon.name,
            backSprite: 'b_' + pokemon.name,
        }
        const data = await p.getPokemonByName(pokemon.name)
        const species = await p.getPokemonSpeciesByName(data.species.name)
        obj['cr'] = species.capture_rate
        if (data.past_types.length === 0) {
            obj["type"] = capitalize(data.types[0].type.name)
            obj["type2"] = data.types.length > 1 ? capitalize(data.types[1].type.name) : "None"
        } else { //not 100% accurate but good enough
            obj["type"] = capitalize(data.past_types[0].types[0].type.name)
            obj["type2"] = data.past_types[0].types > 1 ? capitalize(data.past_types[0].types[1].type.name) : "None"
        }
        obj['growth_rate'] = species.growth_rate.name;
        if(GrowthRates.indexOf(species.growth_rate.name) < 0) GrowthRates.push(species.growth_rate.name);
        obj['base_experience'] = data.base_experience;
        obj['weight'] = data.weight;
        obj['height'] = data.height;
        species.flavor_text_entries.forEach(ft => {
            if (ft.language.name === 'en' && ft.version.name === 'emerald')
                obj['description'] = ft.flavor_text.replaceAll('\n', ' ')
        })
        obj['names'] = []
        obj['descriptions'] = []
        species.names.forEach(n => {
            if(n.language.name === 'en' || n.language.name === 'de')
                obj['names'].push({
                    language: n.language.name,
                    text: n.name
                })
        })
        species.flavor_text_entries.forEach(ft => {
            //console.log(ft.version.name + " " + ft.language.name + ": " + ft.flavor_text.replaceAll('\n', ' '))
            if ((ft.version.name === 'emerald' && ft.language.name === 'en') || ((ft.version.name === 'x-y' || ft.version.name === 'x') && ft.language.name === 'de'))
                obj['descriptions'].push({
                    language: ft.language.name,
                    text: ft.flavor_text.replaceAll('\n', ' ')
                })
        })
        data.stats.forEach(stat => {
            switch (stat.stat.name) {
                case 'hp':
                    obj["hp"] = stat.base_stat
                    break
                case 'attack':
                    obj["atk"] = stat.base_stat
                    break
                case 'defense':
                    obj["def"] = stat.base_stat
                    break
                case 'special-attack':
                    obj["spat"] = stat.base_stat
                    break
                case 'special-defense':
                    obj["spdef"] = stat.base_stat
                    break
                case 'speed':
                    obj["speed"] = stat.base_stat
                    break
            }
        })
        obj["moves"] = []
        data.moves.forEach(move => {
            move.version_group_details.forEach(async detail => {
                if (detail.move_learn_method.name === 'level-up' && detail.version_group.name === 'emerald') {
                    obj['moves'].push({
                        name: move.move.name,
                        levelLearned: detail.level_learned_at
                    })
                    if (!moveNames.includes(move.move.name)) {
                        moveNames.push(move.move.name)
                        console.log("Generating move data for " + move.move.name)
                        const moveData = await p.getMoveByName(move.move.name)
                        const moveObj = {
                            name: move.move.name,
                            type: capitalize(moveData.type.name),
                            power: moveData.power,
                            accuracy: moveData.accuracy == null ? 100: moveData.accuracy,
                            alwaysHits: moveData.accuracy == null,
                            pp: moveData.pp,
                            priority: moveData.priority,
                            category: capitalize(moveData.damage_class.name),
                            target: mapTarget(moveData.target.name),
                            effects: {
                                boosts: [],
                                status: 'none',
                                volatileStatus: 'none',
                            }
                        }
                        if(moveData.effect_chance === 100 || (moveData.meta.ailment_chance === 0 && moveData.meta.ailment !== 'none') ) {
                            moveObj.effects.status = moveData.meta.ailment.name
                            moveData.stat_changes.forEach(statChange => {
                                moveObj.effects.boosts.push({
                                    stat: statChange.stat.name,
                                    change: statChange.change
                                })
                            })

                        }
                        else {
                            moveObj.secondaries = [
                                {
                                    boosts: [],
                                    status: moveData.meta.ailment.name,
                                    volatileStatus: 'none',
                                    chance: moveData.meta.ailment.name === 'none' ? moveData.effect_chance : (moveData.meta.ailment_chance === 0 ? 100 : moveData.meta.ailment_chance),
                                    target: mapTarget(moveData.target.name)
                                },
                            ]
                            moveData.stat_changes.forEach(statChange => {
                                moveObj.secondaries[0].boosts.push({
                                    stat: statChange.stat.name,
                                    change: statChange.change
                                })
                            })
                        }
                        moveData.flavor_text_entries.forEach(ft => {
                            if (ft.language.name === 'en' && ft.version_group.name === 'emerald')
                                moveObj['description'] = ft.flavor_text.replaceAll('\n', ' ')
                        })
                        moveObj['descriptions'] = []
                        moveData.flavor_text_entries.forEach(ft => {
                            // console.log(ft.version_group.name + " " + ft.language.name + ": " + ft.flavor_text.replaceAll('\n', ' '));
                            if ((ft.version_group.name === 'emerald' && ft.language.name === 'en') ||(ft.version_group.name === 'x-y' && ft.language.name === 'de'))
                                moveObj['descriptions'].push({
                                    language: ft.language.name,
                                    text: ft.flavor_text.replaceAll('\n', ' ')
                                })
                        })
                        moveObj['names'] = []
                        moveData.names.forEach(n => {
                            if(n.language.name === 'en' || n.language.name === 'de')
                                moveObj['names'].push({
                                    language: n.language.name,
                                    text: n.name
                                })
                        })
                        moveOut.push(moveObj)
                    }
                }
            })
        })
        pokemonOut.push(obj)
        console.log("Processed " + capitalize(pokemon.name))
    } catch (e) {
        console.log(e)
    }
}

for (let i = 0; i < pokemons.length; i++)
    await process(pokemons[i])

console.log("Writing output")

writeFileSync('out.json', JSON.stringify({
    pokemon: pokemonOut,
    moves: moveOut
}))
console.log(GrowthRates)
console.log("Done")