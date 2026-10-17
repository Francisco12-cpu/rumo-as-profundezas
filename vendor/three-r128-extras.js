/**
 * Complementos pro Three.js r128 (vendor/three.min.js) usados pelo kit de
 * modelos (assets/models/modelos-fundo-do-mar.js), que foi escrito pra r160.
 *
 * - THREE.BufferGeometryUtils.mergeGeometries — porte simplificado de
 *   examples/jsm/utils/BufferGeometryUtils.js (r160, sem morph/interleaved).
 * - THREE.RoundedBoxGeometry — porte de examples/jsm/geometries/RoundedBoxGeometry.js (r160).
 * - THREE.CapsuleGeometry — entrou no núcleo só na r139.
 * - Object3D.prototype.removeFromParent — entrou no núcleo só na r129.
 *
 * Código derivado do three.js (MIT License, Copyright 2010-2023 Three.js Authors).
 */
(function () {
    'use strict';
    const THREE = window.THREE;

    // Iridescência só existe a partir da r141: aqui a propriedade é aceita e
    // ignorada (o material fica sem o efeito), em vez de gerar aviso no console.
    if (!('iridescence' in THREE.MeshPhysicalMaterial.prototype)) {
        THREE.MeshPhysicalMaterial.prototype.iridescence = 0;
        THREE.MeshPhysicalMaterial.prototype.iridescenceIOR = 1.3;
    }

    if (!THREE.Object3D.prototype.removeFromParent) {
        THREE.Object3D.prototype.removeFromParent = function () {
            if (this.parent !== null) this.parent.remove(this);
            return this;
        };
    }

    function mergeGeometries(geometries, useGroups) {
        const isIndexed = geometries[0].index !== null;
        const names = Object.keys(geometries[0].attributes);
        const merged = new THREE.BufferGeometry();
        const indices = [];
        let vertexOffset = 0;
        let groupOffset = 0;
        for (let i = 0; i < geometries.length; i++) {
            const g = geometries[i];
            if (isIndexed !== (g.index !== null)) {
                console.error('mergeGeometries: misturou geometrias indexadas e não indexadas (índice ' + i + ').');
                return null;
            }
            const gNames = Object.keys(g.attributes);
            if (gNames.length !== names.length || !names.every((n) => g.attributes[n])) {
                console.error('mergeGeometries: atributos diferentes na geometria ' + i + '.');
                return null;
            }
            const count = isIndexed ? g.index.count : g.attributes.position.count;
            if (useGroups) merged.addGroup(groupOffset, count, i);
            groupOffset += count;
            if (isIndexed) {
                const arr = g.index.array;
                for (let k = 0; k < arr.length; k++) indices.push(arr[k] + vertexOffset);
            }
            vertexOffset += g.attributes.position.count;
        }
        names.forEach((name) => {
            const first = geometries[0].attributes[name];
            let total = 0;
            geometries.forEach((g) => (total += g.attributes[name].array.length));
            const array = new first.array.constructor(total);
            let offset = 0;
            geometries.forEach((g) => {
                array.set(g.attributes[name].array, offset);
                offset += g.attributes[name].array.length;
            });
            merged.setAttribute(name, new THREE.BufferAttribute(array, first.itemSize, first.normalized));
        });
        if (isIndexed) merged.setIndex(indices);
        return merged;
    }
    THREE.BufferGeometryUtils = Object.assign(THREE.BufferGeometryUtils || {}, { mergeGeometries });

    const tempNormal = new THREE.Vector3();
    function getUv(faceDirVector, normal, uvAxis, projectionAxis, radius, sideLength) {
        const totArcLength = (2 * Math.PI * radius) / 4;
        const centerLength = Math.max(sideLength - 2 * radius, 0);
        const halfArc = Math.PI / 4;
        tempNormal.copy(normal);
        tempNormal[projectionAxis] = 0;
        tempNormal.normalize();
        const arcUvRatio = (0.5 * totArcLength) / (totArcLength + centerLength);
        const arcAngleRatio = 1.0 - tempNormal.angleTo(faceDirVector) / halfArc;
        if (Math.sign(tempNormal[uvAxis]) === 1) return arcAngleRatio * arcUvRatio;
        const lenUv = centerLength / (totArcLength + centerLength);
        return lenUv + arcUvRatio + arcUvRatio * (1.0 - arcAngleRatio);
    }

    class RoundedBoxGeometry extends THREE.BoxGeometry {
        constructor(width = 1, height = 1, depth = 1, segments = 2, radius = 0.1) {
            segments = segments * 2 + 1;
            radius = Math.min(width / 2, height / 2, depth / 2, radius);
            super(1, 1, 1, segments, segments, segments);
            if (segments === 1) return;
            const geometry2 = this.toNonIndexed();
            this.index = null;
            this.attributes.position = geometry2.attributes.position;
            this.attributes.normal = geometry2.attributes.normal;
            this.attributes.uv = geometry2.attributes.uv;

            const position = new THREE.Vector3();
            const normal = new THREE.Vector3();
            const box = new THREE.Vector3(width, height, depth).divideScalar(2).subScalar(radius);
            const positions = this.attributes.position.array;
            const normals = this.attributes.normal.array;
            const uvs = this.attributes.uv.array;
            const faceTris = positions.length / 6;
            const faceDirVector = new THREE.Vector3();
            const halfSegmentSize = 0.5 / segments;

            for (let i = 0, j = 0; i < positions.length; i += 3, j += 2) {
                position.fromArray(positions, i);
                normal.copy(position);
                normal.x -= Math.sign(normal.x) * halfSegmentSize;
                normal.y -= Math.sign(normal.y) * halfSegmentSize;
                normal.z -= Math.sign(normal.z) * halfSegmentSize;
                normal.normalize();
                positions[i + 0] = box.x * Math.sign(position.x) + normal.x * radius;
                positions[i + 1] = box.y * Math.sign(position.y) + normal.y * radius;
                positions[i + 2] = box.z * Math.sign(position.z) + normal.z * radius;
                normals[i + 0] = normal.x;
                normals[i + 1] = normal.y;
                normals[i + 2] = normal.z;
                const side = Math.floor(i / faceTris);
                switch (side) {
                    case 0:
                        faceDirVector.set(1, 0, 0);
                        uvs[j + 0] = getUv(faceDirVector, normal, 'z', 'y', radius, depth);
                        uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'z', radius, height);
                        break;
                    case 1:
                        faceDirVector.set(-1, 0, 0);
                        uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'z', 'y', radius, depth);
                        uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'z', radius, height);
                        break;
                    case 2:
                        faceDirVector.set(0, 1, 0);
                        uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'x', 'z', radius, width);
                        uvs[j + 1] = getUv(faceDirVector, normal, 'z', 'x', radius, depth);
                        break;
                    case 3:
                        faceDirVector.set(0, -1, 0);
                        uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'x', 'z', radius, width);
                        uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'z', 'x', radius, depth);
                        break;
                    case 4:
                        faceDirVector.set(0, 0, 1);
                        uvs[j + 0] = 1.0 - getUv(faceDirVector, normal, 'x', 'y', radius, width);
                        uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'x', radius, height);
                        break;
                    case 5:
                        faceDirVector.set(0, 0, -1);
                        uvs[j + 0] = getUv(faceDirVector, normal, 'x', 'y', radius, width);
                        uvs[j + 1] = 1.0 - getUv(faceDirVector, normal, 'y', 'x', radius, height);
                        break;
                }
            }
        }
    }
    if (!THREE.RoundedBoxGeometry) THREE.RoundedBoxGeometry = RoundedBoxGeometry;

    if (!THREE.CapsuleGeometry) {
        THREE.CapsuleGeometry = class CapsuleGeometry extends THREE.LatheGeometry {
            constructor(radius = 1, length = 1, capSegments = 4, radialSegments = 8) {
                const path = new THREE.Path();
                path.absarc(0, -length / 2, radius, Math.PI * 1.5, 0);
                path.absarc(0, length / 2, radius, 0, Math.PI * 0.5);
                super(path.getPoints(capSegments), radialSegments);
                this.type = 'CapsuleGeometry';
                this.parameters = { radius, length, capSegments, radialSegments };
            }
        };
    }
})();
