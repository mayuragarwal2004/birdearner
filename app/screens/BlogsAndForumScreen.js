import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from '../context/ThemeContext';

const BlogsAndForumScreen = ({ navigation }) => {
    const blogs = [
        {
            id: 1,
            title: 'How to Get Started as a Freelancer',
            snippet: 'Discover tips and tricks for starting your freelancing career...',
            image: 'https://images.ctfassets.net/aq13lwl6616q/6XWcU0TuEPVON55FoyZU2h/d24eb39d8567ae025b8316175b126d88/Become_a_Freelancer__Web_Design_.jpg',
        },
        {
            id: 2,
            title: 'The Future of Remote Work',
            snippet: 'An in-depth look at how remote work is shaping the global workforce...',
            image: 'https://media.digitalnomads.world/wp-content/uploads/2023/05/20105714/The-Future-Impact-of-Remote-Work.jpg',
        },
        {
            id: 3,
            title: 'Top 10 Tools for Freelancers in 2025',
            snippet: 'Explore the best tools to streamline your freelancing workflow...',
            image: 'https://media.licdn.com/dms/image/v2/D5612AQG950LH1RIjjw/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1727146954345?e=2147483647&v=beta&t=5YnpVtFI3nsm1gXxMZ2xjs1zcoVlc64fRmcQRdBgwdU',
        },
    ];

    const { theme, themeStyles } = useTheme();
    const currentTheme = themeStyles[theme];

    const styles = getStyles(currentTheme);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.main}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={currentTheme.text} />
                </TouchableOpacity>
                <Text style={styles.header}>Blogs & Forum</Text>
            </View>

            {/* Content */}
            <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
                {/* Blog Posts */}
                <Text style={styles.sectionTitle}>Latest Blogs</Text>
                {blogs.map((blog) => (
                    <TouchableOpacity key={blog.id} style={styles.blogCard}>
                        <Image source={{ uri: blog.image }} style={styles.blogImage} />
                        <View style={styles.blogContent}>
                            <Text style={styles.blogTitle}>{blog.title}</Text>
                            <Text style={styles.blogSnippet}>{blog.snippet}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                {/* Forum Placeholder */}
                <Text style={styles.sectionTitle}>Community Forum</Text>
                <View style={styles.forumContainer}>
                    <Text style={styles.forumText}>
                        Join the discussion! Share your thoughts, ask questions, and connect with other professionals in the community.
                    </Text>
                    <TouchableOpacity style={styles.forumButton}>
                        <Text style={styles.forumButtonText}>Go to Forum</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (currentTheme) => 
    StyleSheet.create({
        container: {
            flex: 1,
            padding: 20,
            backgroundColor: currentTheme.background2,
        },
        main: {
            marginTop: 45,
            marginBottom: 0,
            display: "flex",
            flexDirection: "row",
            gap: 80,
            alignItems: "center",
        },
        header: {
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            color: currentTheme.text,
        },
        contentContainer: {
            padding: 5,
            backgroundColor: currentTheme.background2,
            margin: 16,
            borderRadius: 8,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: 'bold',
            color: currentTheme.text,
            marginBottom: 12,
            marginTop: 20,
        },
        blogCard: {
            flexDirection: 'row',
            backgroundColor: currentTheme.background || '#f9f9f9',
            borderRadius: 8,
            marginBottom: 16,
            overflow: 'hidden',
            shadowColor: currentTheme.shadow || '#000',
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
        },
        blogImage: {
            width: 100,
            height: 100,
        },
        blogContent: {
            flex: 1,
            padding: 12,
            justifyContent: 'center',
        },
        blogTitle: {
            fontSize: 14,
            fontWeight: 'bold',
            color:'#6A0DAD',
            marginBottom: 4,
        },
        blogSnippet: {
            fontSize: 12,
            color: currentTheme.text || '#555',
        },
        forumContainer: {
            marginTop: 5,
            alignItems: 'center',
            padding: 16,
            backgroundColor: currentTheme.background || '#f0f0f0',
            borderRadius: 8,
            shadowColor: currentTheme.shadow || '#000',
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: 2 },
            shadowRadius: 4,
            elevation: 2,
        },
        forumText: {
            fontSize: 14,
            color: currentTheme.text,
            textAlign: 'center',
            marginBottom: 12,
        },
        forumButton: {
            backgroundColor: currentTheme.primary || '#6A0DAD',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 5,
        },
        forumButtonText: {
            color: '#fff',
            fontSize: 14,
            fontWeight: 'bold',
        },
    });

export default BlogsAndForumScreen;
