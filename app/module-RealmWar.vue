<template>
	<module class="overflow-x-hidden overflow-y-hidden">
		<p-box ref="domMatter" />
		<p-score>红：{{counts[0]}}</p-score>
		<p-score>蓝：{{counts[1]}}</p-score>
		<button @click="start">开始</button>
	</module>
</template>

<script setup>
	import { Engine, Render, Runner, Composites, Events, MouseConstraint, Body, Mouse, Composite, Bodies } from 'matter-js';
	import { onMounted, ref } from 'vue';

	const labelBlock = 'block';
	const sizeBlock = 16;
	const sideBlock = 40;

	const labelChampion = 'champion';
	const labelBase = 'base';
	const diamChampion = 40;
	const strokeChampion = 4;


	const widthWorld = sizeBlock * sideBlock;
	const heightWorld = sizeBlock * sideBlock;


	const catDef = 0b1;
	const catA = 0b10;
	const catB = 0b100;

	const colorA = '#480000';
	const colorB = '#000048';





	const optionInfinity = {
		restitution: 1,
		friction: 0,
		frictionAir: 0,
		frictionStatic: 0,
		inertia: Infinity,
		inverseInertia: 1 / Infinity,
	};


	const widthWall = 80;
	const optionWall = {
		label: 'wall',
		isStatic: true,
		...optionInfinity,
		render: { fillStyle: 'snow' },
	};



	const domMatter = ref(null);
	const counts = ref([sizeBlock * sizeBlock / 2, sizeBlock * sizeBlock / 2]);


	let championA;
	let championB;
	let baseA;
	let baseB;


	onMounted(() => {
		const engine = Engine.create({
			gravity: { x: 0, y: 0 }
		});


		const world = engine.world;


		const render = Render.create({
			element: domMatter.value,
			engine: engine,
			options: {
				width: widthWorld,
				height: heightWorld,
				showAngleIndicator: false,
				showCollisions: true,
				wireframes: false,
			}
		});


		Render.run(render);


		const runner = Runner.create();
		Runner.run(runner, engine);

		Render.lookAt(render, {
			min: { x: 0, y: 0 },
			max: { x: widthWorld, y: heightWorld }
		});


		const mouse = Mouse.create(render.canvas),
			mouseConstraint = MouseConstraint.create(engine, {
				mouse: mouse,
				constraint: {
					stiffness: 0.2,
					render: {
						visible: false
					}
				}
			});
		mouseConstraint.collisionFilter.mask = catDef | catB | catA;
		Composite.add(world, mouseConstraint);

		render.mouse = mouse;





		// 墙
		Composite.add(world, [
			Bodies.rectangle(widthWorld / 2, 0 - widthWall / 2, widthWorld, widthWall, { ...optionWall }),
			Bodies.rectangle(widthWorld / 2, heightWorld + widthWall / 2, widthWorld, widthWall, { ...optionWall }),
			Bodies.rectangle(0 - widthWall / 2, heightWorld / 2, widthWall, heightWorld, { ...optionWall }),
			Bodies.rectangle(widthWorld + widthWall / 2, heightWorld / 2, widthWall, heightWorld, { ...optionWall }),
		]);


		// 格子
		Composite.add(world, Composites.stack(0, 0, 16, 16, 0, 0, (x, y, c, r) => {
			const collisionFilter = {
				category: c < 8 ? catA : catB,
				mask: c < 8 ? catB : catA,
			};

			let fillStyle = c < 8 ? colorA : colorB;


			return Bodies.rectangle(x, y, sideBlock, sideBlock, {
				label: labelBlock,
				isStatic: true,
				...optionInfinity,
				collisionFilter,
				render: {
					fillStyle: fillStyle,
					strokeStyle: '#495051',
					lineWidth: 1,
				}
			});
		}).bodies);


		// 基地
		baseA = Bodies.circle(widthWorld / 16 * 2, heightWorld / 2, diamChampion / 2 - strokeChampion / 2, {
			number: 0,
			label: labelBase,
			isStatic: true,
			...optionInfinity,
			collisionFilter: {
				category: catA,
				mask: catB,
			},
			render: {
				fillStyle: colorA,
				strokeStyle: 'darkgreen',
				lineWidth: 4,
			}
		});
		baseB = Bodies.circle(widthWorld / 16 * (16 - 2), heightWorld / 2, diamChampion / 2 - strokeChampion / 2, {
			number: 1,
			label: labelBase,
			isStatic: true,
			...optionInfinity,
			collisionFilter: {
				category: catB,
				mask: catA,
			},
			render: {
				fillStyle: colorB,
				strokeStyle: 'darkgreen',
				lineWidth: 4,
			}
		});
		Composite.add(world, [baseA, baseB]);


		// 英雄
		championA = Bodies.circle(widthWorld / 16 * 2, heightWorld / 2, diamChampion / 2 - strokeChampion / 2, {
			name: '瑞兹',
			number: 0,
			label: labelChampion,
			isStatic: false,
			...optionInfinity,
			collisionFilter: {
				category: catA,
				mask: catDef | catB,
			},
			render: {
				fillStyle: colorA,
				strokeStyle: '#fff',
				lineWidth: 4,
			}
		});
		championB = Bodies.circle(widthWorld / 16 * (16 - 2), heightWorld / 2, diamChampion / 2 - strokeChampion / 2, {
			name: '概率',
			number: 1,
			label: labelChampion,
			isStatic: false,
			...optionInfinity,
			collisionFilter: {
				category: catB,
				mask: catDef | catA,
			},
			render: {
				fillStyle: colorB,
				strokeStyle: '#fff',
				lineWidth: 4,
			}
		});
		Composite.add(world, [championA, championB]);





		Events.on(engine, 'collisionEnd', ({ pairs }) => {
			for(const { bodyA: a, bodyB: b } of pairs) {
				const bodies = [a, b];

				const ball = bodies.find(({ label }) => label == labelChampion);
				const block = bodies.find(({ label }) => label == labelBlock);
				const base = bodies.find(({ label }) => label == labelBase);


				if(ball && block) {
					block.render.fillStyle = ball.render.fillStyle;
					[block.collisionFilter.category, block.collisionFilter.mask] = [block.collisionFilter.mask, block.collisionFilter.category];

					counts.value[ball.number]++;
					counts.value[1 - ball.number]--;
				}
				else if(ball && base) {
					Render.stop(render);
					Runner.stop(runner);

					alert(`${ball.name}赢了`);
				}


			}
		});

		Events.on(engine, 'beforeUpdate', event => {
			for(const body of event.source.world.bodies) {
				if(!body.baseSpeed) {
					body.baseSpeed = body.speed;
				}
				else {
					const speedMultiplier = body.baseSpeed / body.speed;

					Body.setVelocity(body, {
						x: body.velocity.x * speedMultiplier,
						y: body.velocity.y * speedMultiplier
					});
				}
			}
		});




	});

	const start = () => {
		// world.bodies.sort((a, b) => b.collisionFilter.category - a.collisionFilter.category);
		const speed = 20;

		Body.setVelocity(championA, {
			x: Math.sin((Math.random() * 179 + 1) / 180 * Math.PI) * speed,
			y: Math.cos((Math.random() * 179 + 1) / 180 * Math.PI) * speed,
		});
		Body.setVelocity(championB, {
			x: Math.sin(-(Math.random() * 179 + 1) / 180 * Math.PI) * speed,
			y: Math.cos((Math.random() * 179 + 1) / 180 * Math.PI) * speed,
		});
	};
</script>

<style lang="sass">
module
	height: 100vh

// p-box
// 	canvas
// 		@apply fixed
// 		left: calc(50vw - 1280px / 2)
// 		top: calc(50vh - 720px / 2)

p-box
	@apply block m-4

p-score
	@apply block text-white

button
	@apply text-white
</style>