'use client'

export default function ContactUs() {
  const authors = [
    {
      name: "Papry Rahman",
      role: "Full Stack Developer",
      email: "papryrahman59@gmail.com",
      github: "https://github.com/Ardent-ashes",
      linkedin: "https://www.linkedin.com/in/papry-rahman-15635125b/",
      image: "./papry.png", // Add your image path
      description: "Full Stack Developer specializing in Next.js, React, and Node.js. Experienced in building scalable web applications and RESTful APIs."
    },
    {
      name: "Rubaiya Tarannum Mrittika",
      role: "Full Stack Developer",
      email: "mrittikasaigal@gmail.com",
      github: "https://github.com/mri17",
      linkedin: "https://www.linkedin.com/in/sazzad-hossain-1004/",
      image: "/sazzad.jpg", // Add your image path
      description: "Full Stack Developer with expertise in React, Node.js, and database management. Passionate about creating efficient and user-friendly applications."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-lg text-gray-600">Get in touch with our development team</p>
        </div>

        {/* Authors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {authors.map((author, index) => (
            <div 
              key={index}
              className="bg-white rounded-lg shadow-sm overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center">
                  {/* <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200">
                    <img
                      src={author.image}
                      alt={author.name}
                      className="h-full w-full object-cover"
                    />
                  </div> */}
                  <div className="ml-6">
                    <h2 className="text-xl font-semibold text-gray-900">{author.name}</h2>
                    <p className="text-sm text-gray-600">{author.role}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-gray-600 mb-4">{author.description}</p>
                  
                  <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <a 
                        href={`mailto:${author.email}`}
                        className="ml-3 text-blue-600 hover:text-blue-800"
                      >
                        {author.email}
                      </a>
                    </div>

                    {/* GitHub */}
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.48 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.022A9.606 9.606 0 0112 6.82c.85.004 1.705.115 2.504.337 1.909-1.29 2.747-1.022 2.747-1.022.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.137 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                      </svg>
                      <a 
                        href={author.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-blue-600 hover:text-blue-800"
                      >
                        GitHub Profile
                      </a>
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                      </svg>
                      <a 
                        href={author.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 text-blue-600 hover:text-blue-800"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Contact Information */}
        <div className="mt-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h3>
          <p className="text-gray-600">
            For project inquiries or collaboration opportunities, feel free to reach out to us through email or social media.
          </p>
          <p className="text-gray-600 mt-2">
            We're always interested in discussing new projects and technologies.
          </p>
        </div>
      </div>
    </div>
  );
}