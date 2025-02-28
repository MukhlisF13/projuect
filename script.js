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
    let originalPosition = { x: 0, y: .4, z: 0 }; // Original height set to 2

    function createEnvironmentEntity(model, scale, position, id) {
        return new Promise((resolve) => {
            const entity = document.createElement('a-entity');
            entity.setAttribute('position', `${position.x} ${position.y} ${position.z}`);
            entity.setAttribute('gltf-model', model);
            entity.setAttribute('scale', scale);
            entity.setAttribute('rotation', `0 ${Math.random() * 360} 0`);
            entity.setAttribute('id', id);
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
            entityPromises.push(createEnvironmentEntity('#tree', '0.8 0.8 0.8', getRandomPosition(), 'tree' + i));
        }
        for (let i = 0; i < numRocks; i++) {
            entityPromises.push(createEnvironmentEntity('#rock', '0.1 0.1 0.1', getRandomPosition(), 'rock' + i));
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
                y: 0,
                z: entityPos.z + Math.sin(angle) * distance
            };
            
            if (isPositionValid(position, environmentEntities, 3, otherPosition)) {
                return position;
            }
        }
        
        return {
            x: entityPos.x + offset + (Math.random() * 10),
            y: 0,
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
        platformEntity.setAttribute('position', `${originalPosition.x} 0 ${originalPosition.z}`);
        scene.appendChild(platformEntity);

        steelballEntity = document.createElement('a-entity');
        steelballEntity.setAttribute('gltf-model', '#steelball');
        steelballEntity.setAttribute('position', `${originalPosition.x} ${originalPosition.y} ${originalPosition.z}`);
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
            platformEntity.setAttribute('position', `${platformPosition.x} 0 ${platformPosition.z}`);

            steelballPosition = getSpawnPositionBehindEntity(randomRock, 4, platformPosition);
            steelballEntity.setAttribute('position', `${steelballPosition.x} ${originalPosition.y} ${steelballPosition.z}`); // Set to original height
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

    function resetBallPosition() {
        steelballEntity.setAttribute('position', `${originalPosition.x} ${originalPosition.y} ${originalPosition.z}`);
    }

    function changeEnvironment() {
        ePressCount++;

        if (ePressCount >= maxEPresses) {
            ePressCount = 0;
            const randomTree = environmentEntities[Math.floor(Math.random() * numTrees)];
            const randomRock = environmentEntities[numTrees + Math.floor(Math.random() * numRocks)];
            
            platformPosition = getSpawnPositionBehindEntity(randomTree, 4);
            platformEntity.setAttribute('position', `${platformPosition.x} 0 ${platformPosition.z}`);

            steelballPosition = getSpawnPositionBehindEntity(randomRock, 4, platformPosition);
            steelballEntity.setAttribute('position', `${steelballPosition.x} ${originalPosition.y} ${steelballPosition.z}`); // Set to original height
        }

        platformEntity.setAttribute('visible', !platformEntity.getAttribute('visible'));
        steelballEntity.setAttribute('visible', !steelballEntity.getAttribute('visible'));

        const sky = document.querySelector('a-sky');
        if (sky) {
            sky.setAttribute('src', isOriginalSky ? alternateSky : originalSky);
        }
        isOriginalSky = !isOriginalSky;
    }

    function isTouching(entity1, entity2) {
        const pos1 = entity1.getAttribute('position');
        const pos2 = entity2.getAttribute('position');
        const distance = Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.z - pos2.z, 2));
        const heightDifference = Math.abs(pos1.y - pos2.y);
        return distance < 2 && heightDifference < 0.2; // Adjust based on the model's size
    }

    function checkWinCondition() {
        if (!steelballEntity || !platformEntity) return;

        if (!steelballEntity.getAttribute('visible') || !platformEntity.getAttribute('visible')) return;

        if (isTouching(steelballEntity, platformEntity)) {
            setTimeout(() => {
                alert('You win! The ball is on the platform!');
                resetGame();
            }, 100);
        }
    }

    setInterval(() => {
        checkWinCondition();
    }, 100);

    window.addEventListener('keydown', function (event) {
        if (event.code === 'KeyE') {
            changeEnvironment();
            checkWinCondition();
        }
    });

    createInitialEntities();
    createEnvironment();
});
