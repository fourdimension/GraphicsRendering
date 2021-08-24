//============================================================================
// GROUP NUMBER:06
//
// STUDENT NAME: Li Kexin
// NUS User ID.: t0915953
//
// STUDENT NAME: Zhang Qifan
// NUS User ID.: t0916249
//
// STUDENT NAME: Wang Siwei
// NUS User ID.: t0915995
//
// COMMENTS TO GRADER: 
//
//============================================================================

// FRAGMENT SHADER

#version 430 core

//============================================================================
// Received from rasterizer.
//============================================================================
in vec3 ecPosition;   // Fragment's 3D position in eye space.
in vec3 ecNormal;     // Fragment's normal vector in eye space.
in vec3 v2fTexCoord;  // Fragment's texture coordinates. It is 3D when it is 
                      //   used as texture coordinates to a cubemap.


//============================================================================
// Indicates which object is being rendered.
// 0 -- draw skybox, 1 -- draw brick cube, 2 -- draw wooden cube.
//============================================================================
uniform int WhichObj;  


//============================================================================
// View and projection matrices, etc.
//============================================================================
uniform mat4 ViewMatrix;          // View transformation matrix.
uniform mat4 ModelViewMatrix;     // ModelView matrix.
uniform mat4 ModelViewProjMatrix; // ModelView matrix * Projection matrix.
uniform mat3 NormalMatrix;        // For transforming object-space direction 
                                  //   vector to eye space.

//============================================================================
// Light info.
//============================================================================
uniform vec4 LightPosition; // Given in eye space. Can be directional.
uniform vec4 LightAmbient; 
uniform vec4 LightDiffuse;
uniform vec4 LightSpecular;

// Material shininess for specular reflection.
const float MatlShininess = 64.0;


//============================================================================
// Environment cubemap used for skybox and reflection mapping.
//============================================================================
layout (binding = 0) uniform samplerCube EnvMap;

//============================================================================
// The brick texture map whose color is used as the ambient and diffuse 
// material in the lighting computation.
//============================================================================
layout (binding = 1) uniform sampler2D BrickDiffuseMap;

//============================================================================
// The brick normal map whose color is used as perturbed normal vector
// in the tangent space.
//============================================================================
layout (binding = 2) uniform sampler2D BrickNormalMap;

//============================================================================
// The wood texture map whose color is used as the ambient and diffuse 
// material in the lighting computation.
//============================================================================
layout (binding = 3) uniform sampler2D WoodDiffuseMap;


//============================================================================
// MirrorTileDensity defines the number of hemispherical mirrors across each 
// dimension when the corresponding texture coordinate ranges from 0.0 to 1.0.
//============================================================================
const float MirrorTileDensity = 2.0;  // (0.0, inf)


//============================================================================
// MirrorRadius is the radius of the hemispherical mirror in each tile. 
// The radius is relative to the tile size, which is considered to be 1.0 x 1.0.
//============================================================================
const float MirrorRadius = 0.4;  // (0.0, 0.5]


//============================================================================
// DeltaNormal_Z_Scale is used to exaggerate the height of bump when doing
// normal mapping. The z component of the decoded perturbed normal vector 
// read from the normal map is multiplied by DeltaNormal_Z_Adj.
//============================================================================
const float DeltaNormal_Z_Scale = 1.0 / 5.0;


//============================================================================
// Output to color buffer.
//============================================================================
layout (location = 0) out vec4 FragColor;



/////////////////////////////////////////////////////////////////////////////
// Compute fragment color on skybox.
/////////////////////////////////////////////////////////////////////////////
void drawSkybox() 
{
    FragColor = texture(EnvMap, v2fTexCoord);
}



/////////////////////////////////////////////////////////////////////////////
// Compute fragment color on skybox.
/////////////////////////////////////////////////////////////////////////////
void compute_tangent_vectors( vec3 N, vec3 p, vec2 uv, out vec3 T, out vec3 B )
{
    // Please refer to "Followup: Normal Mapping Without Precomputed Tangents" at
    // http://www.thetenthplanet.de/archives/1180

    // get edge vectors of the pixel triangle
    vec3 dp1 = dFdx( p );
    vec3 dp2 = dFdy( p );
    vec2 duv1 = dFdx( uv );
    vec2 duv2 = dFdy( uv );
 
    // solve the linear system
    vec3 dp2perp = cross( dp2, N );
    vec3 dp1perp = cross( N, dp1 );
    T = normalize( dp2perp * duv1.x + dp1perp * duv2.x );  // Tangent vector
    B = normalize( dp2perp * duv1.y + dp1perp * duv2.y );  // Binormal vector
}



/////////////////////////////////////////////////////////////////////////////
// Compute fragment color on brick cube.
/////////////////////////////////////////////////////////////////////////////
void drawBrickCube()
{
    if (gl_FrontFacing) {
        vec3 viewVec = -normalize(ecPosition);
        vec3 necNormal = normalize(ecNormal);

        vec3 lightVec;
        if (LightPosition.w == 0.0 )
            lightVec = normalize(LightPosition.xyz);
        else
            lightVec = normalize(LightPosition.xyz - ecPosition);

        /////////////////////////////////////////////////////////////////////////////
        // TASK 2:
        // * Construct eye-space Tangent and Binormal vectors.
        // * Read and decode tangent-space perturbation vector from normal map.
        // * Transform perturbation vector to eye space.
        // * Use eye-space perturbation vector as normal vector in lighting
        //   computation using Phong Reflection Model.
        // * Write computed fragment color to FragColor.
        /////////////////////////////////////////////////////////////////////////////

        ///////////////////////////////////
        // TASK 2: WRITE YOUR CODE HERE. //
        ///////////////////////////////////

        vec3 N = normalize(ecNormal);
        vec3 T, B;
        compute_tangent_vectors(N, ecPosition, v2fTexCoord.xy, T, B);
        
        vec3 tanPerturbedNormal;
        vec3 BrickNormalColor = texture(BrickNormalMap, v2fTexCoord.xy).rgb;
        tanPerturbedNormal.xyz = BrickNormalColor.rgb * 2 - 1;
        tanPerturbedNormal.z *= DeltaNormal_Z_Scale;

        tanPerturbedNormal = normalize(tanPerturbedNormal);
        vec3 ecPerturbedNormal = tanPerturbedNormal.x * T +
                                 tanPerturbedNormal.y * B +
                                 tanPerturbedNormal.z * N;

        vec3 reflectVec = reflect(-lightVec, ecPerturbedNormal);
        float N_dot_L = max(0.0, dot( ecPerturbedNormal, lightVec));
        float R_dot_V = max(0.0, dot( reflectVec, viewVec));
        float spec = (R_dot_V == 0.0) ? 0.0 : pow(R_dot_V, MatlShininess);
        vec4 BrickDiffuseColor = texture(BrickDiffuseMap, v2fTexCoord.xy);
        vec4 fColor = LightAmbient * BrickDiffuseColor +
                      LightDiffuse * N_dot_L * BrickDiffuseColor +
                      LightSpecular * spec;
        FragColor = fColor;
    }
    else discard;
}



/////////////////////////////////////////////////////////////////////////////
// Compute fragment color on wooden cube.
/////////////////////////////////////////////////////////////////////////////
void drawWoodenCube()
{
    if (gl_FrontFacing) {
        vec3 viewVec = -normalize(ecPosition);
        vec3 necNormal = normalize(ecNormal);

        vec3 lightVec;
        if (LightPosition.w == 0.0 )
            lightVec = normalize(LightPosition.xyz);
        else
            lightVec = normalize(LightPosition.xyz - ecPosition);

        /////////////////////////////////////////////////////////////////////////////
        // TASK 3:
        // * Determine whether fragment is in wood region or mirror region.
        // * If fragment is in wood region,
        //    -- Read from wood texture map. 
        //    -- Perform Phong lighting computation using the wood texture 
        //       color as the ambient and diffuse material.
        //    -- Write computed fragment color to FragColor.
        // * If fragment is in mirror region,
        //    -- Construct eye-space Tangent and Binormal vectors.
        //    -- Construct tangent-space perturbation vector for a
        //       hemispherical bump.
        //    -- Transform perturbation vector to eye space.
        //    -- Reflect the view vector about the eye-space perturbation vector.
        //    -- Transform reflection vector to World Space.
        //    -- Use world-space reflection vector to access environment cubemap.
        //    -- Write computed fragment color to FragColor.
        /////////////////////////////////////////////////////////////////////////////

        ///////////////////////////////////
        // TASK 3: WRITE YOUR CODE HERE. //
        ///////////////////////////////////
        
        vec2 c = MirrorTileDensity * v2fTexCoord.xy;
        vec2 p = fract( c ) - vec2( 0.5 );
        float sqrDist = p.x * p.x + p.y * p.y;
        if (sqrDist >= MirrorRadius*MirrorRadius) // wood region
        {
            vec3 reflectVec = reflect(-lightVec, necNormal);
            float N_dot_L = max(0.0, dot( necNormal, lightVec));
            float R_dot_V = max(0.0, dot( reflectVec, viewVec));
            float spec = (R_dot_V == 0.0)? 0.0 : pow(R_dot_V, MatlShininess);
            vec4 WoodDiffuseColor = texture(WoodDiffuseMap, v2fTexCoord.xy);
            vec4 fColor = LightAmbient * WoodDiffuseColor +
                          LightDiffuse * N_dot_L * WoodDiffuseColor +
                          LightSpecular * spec;
            FragColor = fColor;
        }else // mirror region
        {
            vec3 N = normalize(ecNormal);
            vec3 T, B;
            compute_tangent_vectors(N, ecPosition, v2fTexCoord.xy, T, B);

            // The perturbed normal vector in tangent space.
            vec3 tanPerturbedNormal = normalize( vec3(p.x, p.y, sqrt(MirrorRadius*MirrorRadius-p.x*p.x-p.y*p.y)));

            // The perturbed normal vector in eye space.
            vec3 ecPerturbedNormal = tanPerturbedNormal.x * T +
                                     tanPerturbedNormal.y * B +
                                     tanPerturbedNormal.z * N;

            vec3 ecReflect = reflect(-viewVec, ecPerturbedNormal);
            vec3 wcReflect = inverse(NormalMatrix) * ecReflect;
            vec3 reflectColor = vec3(texture(EnvMap, wcReflect));
            FragColor = vec4(reflectColor, 1.0);
        }
    }
    else discard;
}


void main()
{
    switch(WhichObj) {
        case 0: drawSkybox(); break;
        case 1: drawBrickCube(); break;
        case 2: drawWoodenCube(); break;
    }
}
