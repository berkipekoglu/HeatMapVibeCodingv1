import SignupForm from '@/components/SignupForm';

export default function SignupPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
            <div className="max-w-md w-full mx-auto">
                <SignupForm />
            </div>
        </div>
    );
}
