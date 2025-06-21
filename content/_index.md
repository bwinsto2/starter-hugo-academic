---
# Leave the homepage title empty to use the site title
title:
date: 2022-10-24
type: landing

sections:
  - block: about.biography
    id: about
    content:
      title: About
      # Choose a user profile to display (a folder name within content/authors/)
      username: admin
  - block: markdown
    id: research
    content:
      title: Research
      subtitle: ''
      text: |-
        <style>
          .custom-summary {
            font-size: 24px; /* Larger font size */
            color: white; /* Text color */
            background-color: #1565c0; /* Background color */
            padding: 10px 15px; /* Padding around the text */
            border-radius: 5px; /* Rounded corners */
            cursor: pointer; /* Cursor indicates clickable */
            border: none; /* No border */
            outline: none; /* No focus outline */
            box-shadow: 0 2px 5px rgba(0,0,0,0.2); /* Subtle shadow for depth */
            width: fit-content;
            margin-bottom: 10px; /* Space below the button */
          }

          .custom-summary:hover {
            background-color: #0056b3; /* Darker blue on hover */
          }
        </style>
        <details id="naturalistic-section">
          <summary class="custom-summary">Using Naturalistic Stimuli to Probe the Cognitive and Neural Effects of Psychedelics</summary>
          <div class="custom-details">
            <h2 id="naturalistic-text">How do psychedelics affect the mind and brain in real-world scenarios?</h2>
            <p> To date, most psychedelic neuroimaging studies have administered drugs to people lying down with their eyes closed. Using these data, the field has built theories and models for how psychedelics alter thoughts, behavior, and brain activity with the assumption that these models will generalize across contexts. During most of waking life, however, people have their eyes open, they process information, interact with other people, and solve problems. Anecdotally, psychedelic effects are different in these states, but the field has not yet characterized how. I record people’s brain activity while they watch movies. Movies simulate many features of real life such as movement through space, social interaction, emotional changes, and narrative structure. These data allow us to probe how psychedelics modulate perception, emotional responses, memory, causal judgment, and much more. </p>
            <h2 id="psilocybin-movies">Movie Stimuli Used in Winston et. al, 2025 (in prep):</h2>
            <iframe width='400' height='315' src='https://www.youtube.com/embed/hSqfxILsKRk' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='450' height='315' src='https://player.vimeo.com/video/124807425?h=69f52cad4d&title=0&byline=0&portrait=0' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/LIsDtHTklrE' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/NBVCIgfyciA' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/XrqSF2OOz_M' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://player.vimeo.com/video/270992364?h=15b4603141' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/yHXLFk8p9WU' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>
          <iframe width='400' height='315' src='https://www.youtube.com/embed/VSR88ULkxIY' frameborder='0' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowfullscreen></iframe>    
        <h2>Example recall data</h2>
        <p><a href="/recall/">Click Here to see Example Recall Data</a></p>
          </div>
        </details>
        <details>
          <summary class="custom-summary">Reopening Critical Periods with Psychedelics</summary>
          <div class="custom-details">
            <h2 id="critical">PATCH and Psi-CLOPS studies:</h2>
            <img src="/static/images/PATCH_logo.png" alt="PATCH logo" style="max-width:150px; margin-bottom: 10px;" />
            <p> An intriguing hypothesis is that psychedelics enable flexible and durable behavioral changes by transiently increasing the malleability of neural circuits. I received a 2025 Discovery Award to conduct the first-ever human study that will measure the effects of psychedelics on neuroplasticity: PATCH - Psilocybin for Amblyopia, Targeting Critical periods in Humans. Stay tuned for more! </p>
          </div>
        </details>
  - block: collection
    id: featured
    content:
      title: Featured Publications
      filters:
        folders:
          - publication
        featured_only: true
    design:
      columns: '2'
      view: card
  - block: markdown
    id: posters
    content:
      title: Featured Posters
      subtitle: ''
      text: |-
        {{< gallery album="posters" >}}
  - block: markdown
    id: scicomm
    content:
      title: Science Communication
      subtitle: ''
      text: |-
        <div class='sk-ww-medium-publication-feed' data-embed-id='25410619'></div><script src='https://widgets.sociablekit.com/medium-publication-feed/widget.js' async defer></script>
  - block: markdown
    id: urbex
    content:
      title: Urban Exploration
      subtitle: ''
      text: |-
        <div data-behold-id="I0AEGufAbE4qLvH8mnzw"></div>
        <script>
          (() => {
            const d=document,s=d.createElement("script");s.type="module";
            s.src="https://w.behold.so/widget.js";d.head.append(s);
          })();
        </script>
  - block: contact
    id: contact
    content:
      title: Contact
      subtitle:
      text: |-
        If you want to reach me, check out all these options for doing that:
      # Contact (add or remove contact options as necessary)
      email: brian.winston@jhu.edu  
      phone: +1 (240) 997 5037
      contact_links:
        - icon: twitter
          icon_pack: fab
          name: DM Me
          link: 'https://twitter.com/winstonian3'
      # Automatically link email and phone or display as text?
      autolink: true
---
