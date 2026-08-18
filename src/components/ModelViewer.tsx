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
    const box = new THREE.Box3().setFromObject(cloned);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    const maxDim = Math.max(size.x, size.y, size.z);
    // Target size for the model to fit well in our view
    const targetSize = 2.5; 
    const scale = targetSize / maxDim;
    
    cloned.scale.setScalar(scale);
    
    // Center the model vertically so it sits on the ground
    cloned.position.x = -center.x * scale;
    cloned.position.y = -box.min.y * scale; // Bottom of model at y=0
    cloned.position.z = -center.z * scale;
    
    return cloned;
  }, [scene]);

  return clonedScene ? <primitive object={clonedScene} /> : null;
}

// Custom camera adjuster
function CameraSetup({ isPreview }: { isPreview?: boolean }) {
  const { camera } = useThree();
  useEffect(() => {
    if (isPreview) {
      camera.position.set(0, 1.8, 2.5);
      camera.lookAt(0, 1.8, 0);
    } else {
      camera.position.set(0, 1.25, 5.5);
      camera.lookAt(0, 1.25, 0);
    }
  }, [camera, isPreview]);
  return null;
}

interface ModelViewerProps {
  modelPath: string;
  className?: string;
  autoRotate?: boolean;
  isPreview?: boolean;
}

export const ModelViewer: React.FC<ModelViewerProps> = ({ 
  modelPath, 
  className = "",
  autoRotate = false,
  isPreview = false
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
          <CameraSetup isPreview={isPreview} />
          
          <ambientLight intensity={0.5} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          <Environment preset="city" />
          
          <Model path={modelPath} />
          
          <ContactShadows resolution={512} scale={10} blur={2} opacity={0.5} far={10} color="#000000" />
          
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate={autoRotate}
            autoRotateSpeed={2}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.8}
            target={isPreview ? [0, 1.8, 0] : [0, 1.25, 0]}
          />
          <Preload all />
        </Canvas>
      </Suspense>
    </div>
  );
};
