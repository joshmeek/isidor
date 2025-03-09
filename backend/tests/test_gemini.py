import os
import asyncio
import google.generativeai as genai

# Configure the Gemini API
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("GEMINI_API_KEY environment variable not set. Please set it and try again.")
    exit(1)

genai.configure(api_key=api_key)
model_name = os.getenv("GEMINI_MODEL", "gemini-1.5-pro")

async def test_gemini_api():
    """Test the Gemini API integration."""
    try:
        # Create a simple prompt
        prompt = "What are the key factors that influence sleep quality?"
        
        # Generate response from Gemini
        model = genai.GenerativeModel(model_name)
        response = await model.generate_content_async(prompt)
        
        # Print the response
        print(f"Model: {model_name}")
        print(f"Prompt: {prompt}")
        print("\nResponse:")
        print(response.text)
        
        return True
    except Exception as e:
        print(f"Error testing Gemini API: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_gemini_api())
    if success:
        print("\nGemini API integration test successful!")
    else:
        print("\nGemini API integration test failed.") 