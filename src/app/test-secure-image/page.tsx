// Test pour vérifier que le composant SecureImage gère correctement les src vides
import { SecureImage } from '@/components/ui/secure-image';

export default function TestSecureImage() {
  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Test SecureImage</h1>
      
      {/* Test avec src null */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Test avec src={null}</h2>
        <SecureImage
          src={null}
          alt="Test null"
          width={200}
          height={150}
          className="border rounded"
        />
      </div>
      
      {/* Test avec src undefined */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Test avec src={undefined}</h2>
        <SecureImage
          src={undefined}
          alt="Test undefined"
          width={200}
          height={150}
          className="border rounded"
        />
      </div>
      
      {/* Test avec src chaîne vide */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Test avec src=""</h2>
        <SecureImage
          src=""
          alt="Test empty string"
          width={200}
          height={150}
          className="border rounded"
        />
      </div>
      
      {/* Test avec src valide */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Test avec src valide</h2>
        <SecureImage
          src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
          alt="Test valide"
          width={200}
          height={150}
          className="border rounded"
        />
      </div>
      
      {/* Test avec PropertyImage */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Test avec PropertyImage</h2>
        <SecureImage
          src={null}
          alt="Test PropertyImage"
          width={200}
          height={150}
          className="border rounded"
          componentType="property"
          propertyType="MAISON"
        />
      </div>
    </div>
  );
}