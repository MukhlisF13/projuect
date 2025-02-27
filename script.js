window.addEventListener('load', function () {
    const scene = document.querySelector('a-scene');
    const numTrees = 10;
    const numRocks = 10;
    let isOriginalSky = true;
    const originalSky = '#sky';
    const alternateSky = '#new_sky_image';

    let steelballEntity, platformEntity;
    let environmentEntities = [];
    let ePressCount = 0;
    const maxEPresses = 3;

    function createEnvironmentEntity(model, scale, position) {
        return new Promise((resolve) => {
            const entity = document.createElement('a-entity');
            entity.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
            entity.setAttribute('gltf-model', model);
            entity.setAttribute('scale', scale);
            entity.setAttribute('rotation', `0 ${Math.random() * 360} 0`);
            entity.setAttribute('static-body', 'shape: box; fit: manual; halfExtents: 1.5 3 1.5;');
            scene.appendChild(entity);
            entity.addEventListener('loaded', () => resolve(entity));
        });
    }

    function getRandomPosition() {
        return {
            x: Math.random() * 100 - 50,
            y: 0,
            z: Math.random() * 100 - 50
        };
    }

    async function createEnvironment() {
        environmentEntities = [];
        const entityPromises = [];

        for (let i = 0; i < numTrees; i++) {
            entityPromises.push(createEnvironmentEntity('#tree', '0.8 0.8 0.8', getRandomPosition()));
        }
        for (let i = 0; i < numRocks; i++) {
            entityPromises.push(createEnvironmentEntity('#rock', '0.1 0.1 0.1', getRandomPosition()));
        }

        environmentEntities = await Promise.all(entityPromises);
        positionEntities();
    }

    function isPositionValid(position, entities, minDistance, otherPosition = null) {
        for (const entity of entities) {
            const entityPos = entity.getAttribute('position');
            const distance = Math.sqrt(
                Math.pow(position.x - entityPos.x, 2) + 
                Math.pow(position.z - entityPos.z, 2)
            );
            if (distance < minDistance) return false;
        }
        
        if (otherPosition) {
            const distanceToOther = Math.sqrt(
                Math.pow(position.x - otherPosition.x, 2) + 
                Math.pow(position.z - otherPosition.z, 2)
            );
            if (distanceToOther < 20) return false;
        }
        return true;
    }

    function getSpawnPositionBehindEntity(entity, offset, otherPosition = null) {
        const entityPos = entity.getAttribute('position');
        const rotation = Math.random() * Math.PI * 2;
        
        for (let attempt = 0; attempt < 16; attempt++) {
            const angle = rotation + (attempt * Math.PI / 8);
            const distance = offset + (Math.random() * 2);
            const position = {
                x: entityPos.x + Math.cos(angle) * distance,
                y: 1.0,
                z: entityPos.z + Math.sin(angle) * distance
            };
            
            if (isPositionValid(position, environmentEntities, 3, otherPosition)) {
                return position;
            }
        }
        
        return {
            x: entityPos.x + offset + (Math.random() * 10),
            y: 1.0,
            z: entityPos.z + offset + (Math.random() * 10)
        };
    }

    function createInitialEntities() {
        platformEntity = document.createElement('a-box');
        platformEntity.setAttribute('width', '4');
        platformEntity.setAttribute('depth', '4');
        platformEntity.setAttribute('height', '0.2');
        platformEntity.setAttribute('color', 'blue');
        platformEntity.setAttribute('visible', 'false');
        platformEntity.setAttribute('static-body', {
            shape: 'box',
            mass: 0,
            collisionFilterMask: 1
        });
        scene.appendChild(platformEntity);

        steelballEntity = document.createElement('a-entity');
        steelballEntity.setAttribute('gltf-model', '#steelball');
        steelballEntity.setAttribute('position', '0 0.5 0');
        steelballEntity.setAttribute('dynamic-body', 'mass: 5; shape: sphere; radius: 0.8; linearDamping: 0.5; angularDamping: 0.5;');
        const moveSpeed = 0.8;
        
        window.addEventListener('keydown', (e) => {
            if (!steelballEntity.getAttribute('visible')) return;
            
            const position = steelballEntity.getAttribute('position');
            switch(e.code) {
                case 'ArrowUp':
                    position.z -= moveSpeed;
                    break;
                case 'ArrowDown':
                    position.z += moveSpeed;
                    break;
                case 'ArrowLeft':
                    position.x -= moveSpeed;
                    break;
                case 'ArrowRight':
                    position.x += moveSpeed;
                    break;
            }
            steelballEntity.setAttribute('position', position);
        });
        steelballEntity.setAttribute('visible', 'true');
        scene.appendChild(steelballEntity);
    }

    let steelballPosition, platformPosition;

    function positionEntities() {
        if (environmentEntities.length < numTrees + numRocks) return;

        const randomTree = environmentEntities[Math.floor(Math.random() * numTrees)];
        const randomRock = environmentEntities[numTrees + Math.floor(Math.random() * numRocks)];

        if (!steelballPosition && !platformPosition) {
            platformPosition = getSpawnPositionBehindEntity(randomTree, 4);
            platformEntity.setAttribute('position', `${platformPosition.x} ${platformPosition.y + 0.1} ${platformPosition.z}`);

            steelballPosition = getSpawnPositionBehindEntity(randomRock, 4, platformPosition);
            steelballEntity.setAttribute('position', `${steelballPosition.x} ${steelballPosition.y + 0.5} ${steelballPosition.z}`);
        }
    }

    function resetGame() {
        ePressCount = 0;
        scene.innerHTML = '';
        createEnvironment();

        const sky = document.createElement('a-sky');
        sky.setAttribute('src', originalSky);
        scene.appendChild(sky);
        isOriginalSky = true;
    }

    function changeEnvironment() {
        ePressCount++;

        if (ePressCount >= maxEPresses) {
            ePressCount = 0;
            const randomTree = environmentEntities[Math.floor(Math.random() * numTrees)];
            const randomRock = environmentEntities[numTrees + Math.floor(Math.random() * numRocks)];
            
            platformPosition = getSpawnPositionBehindEntity(randomTree, 4);
            platformEntity.setAttribute('position', `${platformPosition.x} ${platformPosition.y + 0.1} ${platformPosition.z}`);

            steelballPosition = getSpawnPositionBehindEntity(randomRock, 4, platformPosition);
            steelballEntity.setAttribute('position', `${steelballPosition.x} ${steelballPosition.y + 0.5} ${steelballPosition.z}`);
        }

        platformEntity.setAttribute('visible', !platformEntity.getAttribute('visible'));
        steelballEntity.setAttribute('visible', !steelballEntity.getAttribute('visible'));

        const sky = document.querySelector('a-sky');
        if (sky) {
            sky.setAttribute('src', isOriginalSky ? alternateSky : originalSky);
        }
        isOriginalSky = !isOriginalSky;
    }

    function checkWinCondition() {
        if (!steelballEntity || !platformEntity) return;

        if (!steelballEntity.getAttribute('visible') || !platformEntity.getAttribute('visible')) return;

        const ballPosition = steelballEntity.getAttribute('position');
        const platformPosition = platformEntity.getAttribute('position');

        const distance = Math.sqrt(
            Math.pow(ballPosition.x - platformPosition.x, 2) +
            Math.pow(ballPosition.z - platformPosition.z, 2)
        );
        
        const ballHeight = ballPosition.y;
        const platformHeight = platformPosition.y + 0.1;

        // Adjusted conditions for touching
        if (distance < 0.5 && Math.abs(ballHeight - platformHeight) < 0.1) {
            setTimeout(() => {
                alert('You win! The ball is on the platform!');
                resetGame();
            }, 100);
        }
    }

    setInterval(checkWinCondition, 100);

    window.addEventListener('keydown', function (event) {
        if (event.code === 'KeyE') {
            changeEnvironment();
            checkWinCondition();
        }
    });

    createInitialEntities();
    createEnvironment();
});
