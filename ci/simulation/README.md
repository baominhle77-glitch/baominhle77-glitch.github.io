# Native materials and cameras

`ViewComposer` renders each camera at the exact viewport resolution; it never
stretches a source bitmap. A portrait layout can show context and a moving
optical close-up of the same physical scene. Vessel dimensions do not depend on
the output aspect. This layout component can also compose orbital, historical
or character simulations supplied by other stage factories.

`WaterStage` is a reusable2.5D optical component: a closed analytic vessel,
height-field/refraction, depth shading, Fresnel/specular reflections, moving
caustics and meniscus. Irregular brown/gray/black flakes float at the interface;
soft shadows and rough faces vary with their geometry. Surface dye parcels and
subsurface tracers are separate physical actors. There are no editorial arrows,
parallel-grid overlays or flat rectangular water slabs.

`transport.py` uses a qualitative thin-layer radial forcing model:
`r² = r0² + 2∫F(t)dt`, `v=F(t)/r`. An impulse opens the clear patch in0.3–0.5s
and decelerates; continued feeding adds sustained forcing. Rim contact clamps
position, producing an edge pile. Two closed return cells advect dye below the
surface, with outward top flow and inward return below. This illustrates the
mechanism discussed by Roché et al., PRL2014; the coefficients are dimensionless
and are not a fit or a CFD validation of that experiment.

Episode names, words and calibrated camera values stay in the episode adapter.
The common `gate_chung` runtime imports none of this water/episode code. G10/G11
supplement the motion/typography/source/aspect gates; §8 visual review remains
required before delivery.
