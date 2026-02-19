'use client';

export default function MembershipBanner() {
  return (
    <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">⚠️</span>
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Membership Required</h3>
          <p className="text-amber-800 text-sm leading-relaxed">
            Well done! You&apos;ve hit your 4 match quota as a guest. You&apos;ll need to become a
            Pickleball Victoria member to continue playing. This covers your insurance and allows
            us to operate. You can register here and select &quot;Healesville Pickleball&quot; under Club.
          </p>
          <a
            href="https://www.pickleballvictoria.org/rego/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Register Now →
          </a>
        </div>
      </div>
    </div>
  );
}
