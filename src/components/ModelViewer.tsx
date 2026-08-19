import React, { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows, Preload } from '@react-three/drei';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';

// Model component that loads and renders the GLTF file
function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  
  // Clone, center and scale the model based on its bounding box
  const clonedScene = React.useMemo(() => {
    if (!scene) return null;
    const cloned = scene.clone();
    
    // Apply model-specific scaling and positioning to guarantee uniform size
    // SkinnedMesh bounding boxes are often inaccurate, so manual tuning is safest.
    if (path.includes('spider-man')) {
      cloned.scale.setScalar(0.015);
      cloned.position.set(0, -1.2, 0);
    } else if (path.includes('batman')) {
      cloned.scale.setScalar(0.04);
      cloned.position.set(0, -1.2, 0);
    } else {
      // Default auto-scaling for non-skinned meshes like Wall-E
      const box = new THREE.Box3();
      cloned.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          box.expandByObject(child);
        }
      });
      if (!box.isEmpty()) {
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.2 / maxDim;
        cloned.scale.setScalar(scale);
        cloned.position.x = -center.x * scale;
        cloned.position.y = -box.min.y * scale - 1.2; 
        cloned.position.z = -center.z * scale;
      }
    }
    
    return cloned;
  }, [scene, path]);

  return clonedScene ? <primitive object={clonedScene} /> : null;
}

// Custom camera adjuster
function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    // Both views now show the complete model
    camera.position.set(0, 0, 5.5);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

interface ModelViewerProps {
  modelPath: string;
  className?: string;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ 
  modelPath, 
  className = ""
}) => {
  return (
    <div className={`relative ${className}`}>
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading 3D Model...</span>
        </div>
      }>
        <Canvas shadows dpr={[1, 2]}>
          <CameraSetup />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Environment preset="city" />
          
          <Model path={modelPath} />
          
          <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            enableRotate={false}
            autoRotate={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            target={[0, 0, 0]}
          />
          <Preload all />
        </Canvas>
      </Suspense>
    </div>
  );
};
